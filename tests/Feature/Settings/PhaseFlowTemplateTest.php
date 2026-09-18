<?php

namespace Tests\Feature\Settings;

use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseFlowTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_a_phase_flow_template()
    {
        $owner = User::factory()->owner()->create();

        $response = $this->actingAs($owner)->post(route('phase-flow-templates.store'), [
            'name' => 'Residential Build',
            'description' => 'Standard residential pipeline',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_flow_templates', ['name' => 'Residential Build']);
    }

    public function test_staff_cannot_view_or_create_phase_flow_templates()
    {
        $staff = User::factory()->create();

        $this->actingAs($staff)->get(route('phase-flow-templates.index'))->assertForbidden();
        $this->actingAs($staff)->post(route('phase-flow-templates.store'), ['name' => 'X'])->assertForbidden();
    }

    public function test_a_flow_with_no_steps_is_not_ready()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();

        $response = $this->actingAs($owner)->get(route('phase-flow-templates.index'));

        $response->assertInertia(fn ($page) => $page
            ->where('phaseFlowTemplates.0.id', $flow->id)
            ->where('phaseFlowTemplates.0.is_ready', false));
    }

    public function test_a_flow_with_a_single_connected_chain_is_ready()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $second = PhaseTemplate::factory()->for($flow, 'flow')->create();
        PhaseTemplate::factory()->for($flow, 'flow')->create(['next_phase_template_id' => $second->id]);

        $response = $this->actingAs($owner)->get(route('phase-flow-templates.index'));

        $response->assertInertia(fn ($page) => $page->where('phaseFlowTemplates.0.is_ready', true));
    }

    public function test_owner_can_rename_a_phase_flow_template()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create(['name' => 'Old name']);

        $response = $this->actingAs($owner)->patch(route('phase-flow-templates.update', $flow), [
            'name' => 'New name',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('New name', $flow->fresh()->name);
    }

    public function test_owner_can_delete_a_phase_flow_template_and_its_steps_go_with_it()
    {
        $owner = User::factory()->owner()->create();
        $flow = PhaseFlowTemplate::factory()->create();
        $step = PhaseTemplate::factory()->for($flow, 'flow')->create();

        $response = $this->actingAs($owner)->delete(route('phase-flow-templates.destroy', $flow));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('phase_flow_templates', ['id' => $flow->id]);
        $this->assertDatabaseMissing('phase_templates', ['id' => $step->id]);
    }
}
