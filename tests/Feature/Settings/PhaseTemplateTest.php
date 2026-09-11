<?php

namespace Tests\Feature\Settings;

use App\Models\PhaseTemplate;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_a_phase_template()
    {
        $owner = User::factory()->owner()->create();

        $response = $this->actingAs($owner)->post(route('phase-templates.store'), [
            'name' => 'Design',
            'description' => 'Initial design phase',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_templates', [
            'name' => 'Design',
        ]);
    }

    public function test_new_phase_templates_are_appended_after_existing_ones()
    {
        $owner = User::factory()->owner()->create();
        PhaseTemplate::factory()->create(['sort_order' => 0]);
        PhaseTemplate::factory()->create(['sort_order' => 1]);

        $this->actingAs($owner)->post(route('phase-templates.store'), [
            'name' => 'Handover',
        ]);

        $this->assertDatabaseHas('phase_templates', [
            'name' => 'Handover',
            'sort_order' => 2,
        ]);
    }

    public function test_staff_cannot_view_phase_templates()
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff)->get(route('phase-templates.index'));

        $response->assertForbidden();
    }

    public function test_staff_cannot_create_a_phase_template()
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff)->post(route('phase-templates.store'), [
            'name' => 'Design',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_reorder_phase_templates()
    {
        $owner = User::factory()->owner()->create();
        $first = PhaseTemplate::factory()->create(['sort_order' => 0]);
        $second = PhaseTemplate::factory()->create(['sort_order' => 1]);

        $response = $this->actingAs($owner)->post(route('phase-templates.reorder'), [
            'ids' => [$second->id, $first->id],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(0, $second->fresh()->sort_order);
        $this->assertSame(1, $first->fresh()->sort_order);
    }

    public function test_owner_can_delete_a_phase_template()
    {
        $owner = User::factory()->owner()->create();
        $template = PhaseTemplate::factory()->create();

        $response = $this->actingAs($owner)->delete(route('phase-templates.destroy', $template));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('phase_templates', ['id' => $template->id]);
    }
}
