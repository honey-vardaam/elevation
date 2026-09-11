<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPhaseAdvanceTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_advancing_a_non_last_phase_completes_it_and_starts_the_next()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create(['status' => 'ongoing']);
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $current = ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'in_progress']);
        $next = ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'pending']);

        $response = $this->actingAs($manager)->post(route('projects.phases.advance', [$project, $current]));

        $response->assertSessionHasNoErrors();
        $this->assertSame('completed', $current->fresh()->status->value);
        $this->assertSame('in_progress', $next->fresh()->status->value);
        $this->assertSame('ongoing', $project->fresh()->status->value);

        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $current->id,
            'type' => 'status_changed',
        ]);
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $next->id,
            'type' => 'status_changed',
        ]);
    }

    public function test_manager_advancing_the_last_phase_marks_the_project_completed()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create(['status' => 'ongoing']);
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'completed']);
        $last = ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'in_progress']);

        $response = $this->actingAs($manager)->post(route('projects.phases.advance', [$project, $last]));

        $response->assertSessionHasNoErrors();
        $this->assertSame('completed', $last->fresh()->status->value);
        $this->assertSame('completed', $project->fresh()->status->value);

        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $last->id,
            'type' => 'project_completed',
        ]);
    }

    public function test_editor_cannot_advance_a_phase()
    {
        $editor = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($editor)->editor()->create();
        $phase = ProjectPhase::factory()->for($project)->create(['sort_order' => 0]);

        $response = $this->actingAs($editor)->post(route('projects.phases.advance', [$project, $phase]));

        $response->assertForbidden();
    }

    public function test_advancing_an_already_completed_phase_is_a_no_op()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create(['status' => 'ongoing']);
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $current = ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'completed']);
        $next = ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'in_progress']);

        // Simulates a second, racing "advance" request arriving after the
        // first already completed this phase - it must not double-log or
        // touch the next phase again.
        $response = $this->actingAs($manager)->post(route('projects.phases.advance', [$project, $current]));

        $response->assertSessionHasNoErrors();
        $this->assertSame('in_progress', $next->fresh()->status->value);
        $this->assertDatabaseCount('phase_activities', 0);
    }

    public function test_manual_status_change_is_logged_on_the_timeline()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $phase = ProjectPhase::factory()->for($project)->create(['status' => 'pending']);

        $response = $this->actingAs($manager)->patch(route('projects.phases.update', [$project, $phase]), [
            'status' => 'in_progress',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'user_id' => $manager->id,
            'type' => 'status_changed',
        ]);
    }
}
