<?php

namespace Tests\Feature;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_guests_are_redirected_to_the_login_page()
    {
        $response = $this->get(route('dashboard'));
        $response->assertRedirect(route('login'));
    }

    public function test_authenticated_users_can_visit_the_dashboard()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        $response = $this->get(route('dashboard'));
        $response->assertOk();
    }

    public function test_status_counts_only_reflect_accessible_projects()
    {
        $user = User::factory()->create();
        Project::factory()->for($user, 'owner')->create(['status' => 'ongoing']);
        Project::factory()->for($user, 'owner')->create(['status' => 'on_hold']);
        Project::factory()->create(['status' => 'ongoing']); // not accessible

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('statusCounts.ongoing', 1)
            ->where('statusCounts.on_hold', 1)
            ->where('statusCounts.completed', 0)
        );
    }

    public function test_needs_attention_lists_in_progress_phases_with_open_change_requests()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $phase = ProjectPhase::factory()->for($project)->create(['status' => 'in_progress', 'name' => 'Design']);
        PhaseActivity::factory()->for($phase, 'projectPhase')->changeRequest()->create();

        $quietPhase = ProjectPhase::factory()->for($project)->create(['status' => 'in_progress', 'name' => 'Quiet']);
        PhaseActivity::factory()->for($quietPhase, 'projectPhase')->create();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->has('needsAttention', 1)
            ->where('needsAttention.0.phase_name', 'Design')
            ->where('needsAttention.0.open_change_requests_count', 1)
        );
    }

    public function test_inaccessible_project_activity_does_not_leak_into_needs_attention()
    {
        $user = User::factory()->create();
        $foreignProject = Project::factory()->create();
        $foreignPhase = ProjectPhase::factory()->for($foreignProject)->create(['status' => 'in_progress']);
        PhaseActivity::factory()->for($foreignPhase, 'projectPhase')->changeRequest()->create();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page->has('needsAttention', 0));
    }

    public function test_owner_stats_present_for_owner_and_absent_for_staff()
    {
        $owner = User::factory()->owner()->create();
        $staff = User::factory()->create();
        ProjectMember::factory()->for(Project::factory()->create())->for($staff)->viewer()->create();

        $ownerResponse = $this->actingAs($owner)->get(route('dashboard'));
        $ownerResponse->assertInertia(fn ($page) => $page
            ->where('isOwner', true)
            ->has('ownerStats')
        );

        $staffResponse = $this->actingAs($staff)->get(route('dashboard'));
        $staffResponse->assertInertia(fn ($page) => $page
            ->where('isOwner', false)
            ->where('ownerStats', null)
        );
    }

    public function test_hours_tracked_today_reflects_completed_and_running_entries()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => today()->setTime(9, 0),
            'ended_at' => today()->setTime(10, 0),
        ]);
        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => now()->subMinutes(30),
            'ended_at' => null,
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('hoursTrackedToday', 1.5)
        );
    }

    public function test_weekly_activity_has_seven_days_attributing_the_right_hours_and_tasks()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => today()->setTime(9, 0),
            'ended_at' => today()->setTime(11, 0),
        ]);
        Task::factory()->for($user)->completed()->create(['completed_at' => today()]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->has('weeklyActivity', 7)
            ->where('weeklyActivity.6.date', today()->toDateString())
            ->where('weeklyActivity.6.hours', 2)
            ->where('weeklyActivity.6.tasks_completed', 1)
        );
    }

    public function test_weekly_comparison_reflects_the_change_from_the_prior_week()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => today()->subDays(10)->setTime(9, 0),
            'ended_at' => today()->subDays(10)->setTime(11, 0),
        ]);
        Task::factory()->for($user)->completed()->create(['completed_at' => today()->subDays(10)]);

        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => today()->setTime(9, 0),
            'ended_at' => today()->setTime(12, 0),
        ]);
        Task::factory()->for($user)->completed()->create(['completed_at' => today()]);
        Task::factory()->for($user)->completed()->create(['completed_at' => today()]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('weeklyComparison.hours_delta_pct', 50)
            ->where('weeklyComparison.tasks_delta', 1)
        );
    }

    public function test_weekly_comparison_hours_delta_is_null_without_prior_week_hours()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => today()->setTime(9, 0),
            'ended_at' => today()->setTime(11, 0),
        ]);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->where('weeklyComparison.hours_delta_pct', null)
        );
    }

    public function test_allotted_projects_only_includes_accessible_projects()
    {
        $user = User::factory()->create();
        Project::factory()->for($user, 'owner')->create(['name' => 'Mine']);
        Project::factory()->create(['name' => 'Not mine']);

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertInertia(fn ($page) => $page
            ->has('allottedProjects', 1)
            ->where('allottedProjects.0.name', 'Mine')
        );
    }
}
