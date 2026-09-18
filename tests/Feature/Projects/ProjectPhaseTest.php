<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseFlowTemplate;
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
        $flow = PhaseFlowTemplate::factory()->create();
        $project = Project::factory()->create(['phase_flow_template_id' => $flow->id]);
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $template = PhaseTemplate::factory()->for($flow, 'flow')->create(['name' => 'Design']);

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
        $flow = PhaseFlowTemplate::factory()->create();
        $project = Project::factory()->create(['phase_flow_template_id' => $flow->id]);
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $template = PhaseTemplate::factory()->for($flow, 'flow')->create();
        ProjectPhase::factory()->for($project)->create(['phase_template_id' => $template->id]);

        $response = $this->actingAs($user)->post(route('projects.phases.store', $project), [
            'phase_template_id' => $template->id,
        ]);

        $response->assertSessionHasErrors('phase_template_id');
    }

    public function test_a_step_from_another_flow_cannot_be_attached()
    {
        $user = User::factory()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $project = Project::factory()->create(['phase_flow_template_id' => $flow->id]);
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $otherFlow = PhaseFlowTemplate::factory()->create();
        $foreignTemplate = PhaseTemplate::factory()->for($otherFlow, 'flow')->create();

        $response = $this->actingAs($user)->post(route('projects.phases.store', $project), [
            'phase_template_id' => $foreignTemplate->id,
        ]);

        $response->assertSessionHasErrors('phase_template_id');
    }

    public function test_editor_cannot_attach_a_phase()
    {
        $user = User::factory()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $project = Project::factory()->create(['phase_flow_template_id' => $flow->id]);
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $template = PhaseTemplate::factory()->for($flow, 'flow')->create();

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

    public function test_member_can_view_a_phases_activities_read_only()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create(['name' => 'Design']);

        $response = $this->actingAs($user)->getJson(route('projects.phases.show', [$project, $phase]));

        $response->assertOk();
        $response->assertJson([
            'phase' => ['id' => $phase->id, 'name' => 'Design'],
        ]);
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

    public function test_new_project_adopts_the_selected_phase_flow_when_requested()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $construction = PhaseTemplate::factory()->for($flow, 'flow')->create(['name' => 'Construction']);
        $design = PhaseTemplate::factory()->for($flow, 'flow')->create([
            'name' => 'Design',
            'next_phase_template_id' => $construction->id,
        ]);

        $response = $this->actingAs($owner)->post(route('projects.store'), [
            'name' => 'New Build',
            'phase_flow_template_id' => $flow->id,
        ]);

        $response->assertSessionHasNoErrors();
        $project = Project::query()->where('name', 'New Build')->firstOrFail();

        $this->assertSame($flow->id, $project->phase_flow_template_id);
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
        $flow = PhaseFlowTemplate::factory()->create();
        PhaseTemplate::factory()->for($flow, 'flow')->create();

        $response = $this->actingAs($owner)->post(route('projects.store'), [
            'name' => 'No Pipeline',
        ]);

        $response->assertSessionHasNoErrors();
        $project = Project::query()->where('name', 'No Pipeline')->firstOrFail();

        $this->assertDatabaseCount('project_phases', 0);
        $this->assertSame(0, $project->phases()->count());
    }

    public function test_available_phase_templates_are_scoped_to_the_projects_flow()
    {
        $owner = User::factory()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create(['phase_flow_template_id' => $flow->id]);
        $ownStep = PhaseTemplate::factory()->for($flow, 'flow')->create(['name' => 'Own Step']);

        $otherFlow = PhaseFlowTemplate::factory()->create();
        PhaseTemplate::factory()->for($otherFlow, 'flow')->create(['name' => 'Foreign Step']);

        $response = $this->actingAs($owner)->get(route('projects.show', $project));

        $response->assertInertia(fn ($page) => $page
            ->where('availablePhaseTemplates', [
                ['id' => $ownStep->id, 'name' => 'Own Step'],
            ]));
    }
}
