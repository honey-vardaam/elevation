<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectPhase;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectCurrentPhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_project_with_no_phases_has_no_current_phase()
    {
        $project = Project::factory()->create();

        $this->assertNull($project->currentPhase());
    }

    public function test_the_first_pending_phase_is_current_when_nothing_has_started()
    {
        $project = Project::factory()->create();
        $first = ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'pending']);
        ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'pending']);

        $this->assertSame($first->id, $project->currentPhase()->id);
    }

    public function test_the_in_progress_phase_is_current_even_if_it_is_not_first()
    {
        $project = Project::factory()->create();
        ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'completed']);
        $active = ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'in_progress']);
        ProjectPhase::factory()->for($project)->create(['sort_order' => 2, 'status' => 'pending']);

        $this->assertSame($active->id, $project->currentPhase()->id);
    }

    public function test_a_project_with_every_phase_completed_has_no_current_phase()
    {
        $project = Project::factory()->create();
        ProjectPhase::factory()->for($project)->create(['sort_order' => 0, 'status' => 'completed']);
        ProjectPhase::factory()->for($project)->create(['sort_order' => 1, 'status' => 'completed']);

        $this->assertNull($project->currentPhase());
    }
}
