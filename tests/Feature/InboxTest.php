<?php

namespace Tests\Feature;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InboxTest extends TestCase
{
    use RefreshDatabase;

    public function test_inbox_lists_conversations_from_owned_and_member_projects_only()
    {
        $user = User::factory()->create();

        $ownedProject = Project::factory()->for($user, 'owner')->create();
        $ownedPhase = ProjectPhase::factory()->for($ownedProject)->create(['name' => 'Design']);
        PhaseActivity::factory()->for($ownedPhase, 'projectPhase')->create(['created_at' => now()->subMinute()]);

        $memberProject = Project::factory()->create();
        ProjectMember::factory()->for($memberProject)->for($user)->viewer()->create();
        $memberPhase = ProjectPhase::factory()->for($memberProject)->create(['name' => 'Construction']);
        PhaseActivity::factory()->for($memberPhase, 'projectPhase')->create(['created_at' => now()]);

        $foreignProject = Project::factory()->create();
        $foreignPhase = ProjectPhase::factory()->for($foreignProject)->create(['name' => 'Handover']);
        PhaseActivity::factory()->for($foreignPhase, 'projectPhase')->create();

        $response = $this->actingAs($user)->get(route('inbox.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->has('conversations', 2)
            ->where('conversations.0.phase_name', 'Construction')
            ->where('conversations.1.phase_name', 'Design')
        );
    }

    public function test_phases_with_no_activity_are_excluded()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($user)->get(route('inbox.index'));

        $response->assertInertia(fn ($page) => $page->has('conversations', 0));
    }

    public function test_selecting_a_phase_loads_its_timeline()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $activity = PhaseActivity::factory()->for($phase, 'projectPhase')->create(['body' => 'Hello there']);

        $response = $this->actingAs($user)->get(route('inbox.index', ['phase' => $phase->id]));

        $response->assertInertia(fn ($page) => $page
            ->where('activePhaseId', $phase->id)
            ->has('activities', 1)
            ->where('activities.0.id', $activity->id)
        );
    }

    public function test_selecting_a_phase_from_an_inaccessible_project_is_ignored()
    {
        $user = User::factory()->create();
        $foreignProject = Project::factory()->create();
        $foreignPhase = ProjectPhase::factory()->for($foreignProject)->create();
        PhaseActivity::factory()->for($foreignPhase, 'projectPhase')->create();

        $response = $this->actingAs($user)->get(route('inbox.index', ['phase' => $foreignPhase->id]));

        $response->assertInertia(fn ($page) => $page
            ->where('activePhaseId', null)
            ->where('activePhase', null)
            ->has('activities', 0)
        );
    }
}
