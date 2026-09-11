<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseTemplate;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPhaseTest extends TestCase
{
    use RefreshDatabase;

    public function test_manager_can_attach_a_phase_template_to_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $template = PhaseTemplate::factory()->create(['name' => 'Design']);

        $response = $this->actingAs($user)->post(route('projects.phases.store', $project), [
            'phase_template_id' => $template->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('project_phases', [
            'project_id' => $project->id,
            'phase_template_id' => $template->id,
            'name' => 'Design',
            'status' => 'pending',
        ]);
    }

    public function test_same_phase_template_cannot_be_attached_twice()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $template = PhaseTemplate::factory()->create();
        ProjectPhase::factory()->for($project)->create(['phase_template_id' => $template->id]);

        $response = $this->actingAs($user)->post(route('projects.phases.store', $project), [
            'phase_template_id' => $template->id,
        ]);

        $response->assertSessionHasErrors('phase_template_id');
    }

    public function test_editor_cannot_attach_a_phase()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $template = PhaseTemplate::factory()->create();

        $response = $this->actingAs($user)->post(route('projects.phases.store', $project), [
            'phase_template_id' => $template->id,
        ]);

        $response->assertForbidden();
    }

    public function test_manager_can_update_a_phase_status()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $phase = ProjectPhase::factory()->for($project)->create(['status' => 'pending']);

        $response = $this->actingAs($user)->patch(route('projects.phases.update', [$project, $phase]), [
            'status' => 'completed',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('completed', $phase->fresh()->status->value);
    }

    public function test_manager_can_reorder_phases()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $first = ProjectPhase::factory()->for($project)->create(['sort_order' => 0]);
        $second = ProjectPhase::factory()->for($project)->create(['sort_order' => 1]);

        $response = $this->actingAs($user)->post(route('projects.phases.reorder', $project), [
            'ids' => [$second->id, $first->id],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(0, $second->fresh()->sort_order);
        $this->assertSame(1, $first->fresh()->sort_order);
    }

    public function test_manager_can_remove_a_phase()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($user)->delete(route('projects.phases.destroy', [$project, $phase]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('project_phases', ['id' => $phase->id]);
    }

    public function test_phase_from_another_project_is_not_reachable_through_a_different_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $otherProject = Project::factory()->create();
        $otherPhase = ProjectPhase::factory()->for($otherProject)->create();

        $response = $this->actingAs($user)->patch(route('projects.phases.update', [$project, $otherPhase]), [
            'status' => 'completed',
        ]);

        $response->assertNotFound();
    }

    public function test_new_project_adopts_the_organizations_phase_pipeline_when_requested()
    {
        $owner = User::factory()->owner()->create();
        $design = PhaseTemplate::factory()->create(['name' => 'Design', 'sort_order' => 0]);
        $construction = PhaseTemplate::factory()->create(['name' => 'Construction', 'sort_order' => 1]);

        $response = $this->actingAs($owner)->post(route('projects.store'), [
            'name' => 'New Build',
            'apply_phase_pipeline' => true,
        ]);

        $response->assertSessionHasNoErrors();
        $project = Project::query()->where('name', 'New Build')->firstOrFail();

        $this->assertDatabaseHas('project_phases', [
            'project_id' => $project->id,
            'phase_template_id' => $design->id,
            'sort_order' => 0,
        ]);
        $this->assertDatabaseHas('project_phases', [
            'project_id' => $project->id,
            'phase_template_id' => $construction->id,
            'sort_order' => 1,
        ]);
    }

    public function test_new_project_skips_the_pipeline_when_not_requested()
    {
        $owner = User::factory()->owner()->create();
        PhaseTemplate::factory()->create();

        $response = $this->actingAs($owner)->post(route('projects.store'), [
            'name' => 'No Pipeline',
            'apply_phase_pipeline' => false,
        ]);

        $response->assertSessionHasNoErrors();
        $project = Project::query()->where('name', 'No Pipeline')->firstOrFail();

        $this->assertDatabaseCount('project_phases', 0);
        $this->assertSame(0, $project->phases()->count());
    }
}
