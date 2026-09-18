<?php

namespace Tests\Feature\Settings;

use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseFlowStepTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_a_disconnected_step_to_a_flow()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();

        $response = $this->actingAs($owner)->post(route('phase-flow-templates.steps.store', $flow), [
            'name' => 'Design',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_templates', [
            'phase_flow_template_id' => $flow->id,
            'name' => 'Design',
            'next_phase_template_id' => null,
        ]);
    }

    public function test_owner_can_connect_two_steps()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $a = PhaseTemplate::factory()->for($flow, 'flow')->create();
        $b = PhaseTemplate::factory()->for($flow, 'flow')->create();

        $response = $this->actingAs($owner)->patch(route('phase-flow-templates.steps.connect', [$flow, $a]), [
            'next_phase_template_id' => $b->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame($b->id, $a->fresh()->next_phase_template_id);
    }

    public function test_connecting_a_step_onto_an_already_connected_target_is_rejected()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $a = PhaseTemplate::factory()->for($flow, 'flow')->create();
        $b = PhaseTemplate::factory()->for($flow, 'flow')->create();
        $c = PhaseTemplate::factory()->for($flow, 'flow')->create(['next_phase_template_id' => $b->id]);

        $response = $this->actingAs($owner)->patch(route('phase-flow-templates.steps.connect', [$flow, $a]), [
            'next_phase_template_id' => $b->id,
        ]);

        $response->assertSessionHasErrors();
        $this->assertNull($a->fresh()->next_phase_template_id);
        $this->assertSame($b->id, $c->fresh()->next_phase_template_id);
    }

    public function test_connecting_two_steps_into_a_cycle_is_rejected()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $a = PhaseTemplate::factory()->for($flow, 'flow')->create();
        $b = PhaseTemplate::factory()->for($flow, 'flow')->create(['next_phase_template_id' => $a->id]);

        $response = $this->actingAs($owner)->patch(route('phase-flow-templates.steps.connect', [$flow, $a]), [
            'next_phase_template_id' => $b->id,
        ]);

        $response->assertSessionHasErrors();
        $this->assertNull($a->fresh()->next_phase_template_id);
    }

    public function test_deleting_a_middle_step_splices_its_neighbors_together()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $c = PhaseTemplate::factory()->for($flow, 'flow')->create();
        $b = PhaseTemplate::factory()->for($flow, 'flow')->create(['next_phase_template_id' => $c->id]);
        $a = PhaseTemplate::factory()->for($flow, 'flow')->create(['next_phase_template_id' => $b->id]);

        $response = $this->actingAs($owner)->delete(route('phase-flow-templates.steps.destroy', [$flow, $b]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('phase_templates', ['id' => $b->id]);
        $this->assertSame($c->id, $a->fresh()->next_phase_template_id);
    }

    public function test_staff_cannot_manage_flow_steps()
    {
        $staff = User::factory()->create();
        $flow = PhaseFlowTemplate::factory()->create();

        $response = $this->actingAs($staff)->post(route('phase-flow-templates.steps.store', $flow), [
            'name' => 'Design',
        ]);

        $response->assertForbidden();
    }
}
