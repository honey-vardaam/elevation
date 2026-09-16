<?php

namespace Tests\Feature\Settings;

use App\Models\DefaultFolderTemplate;
use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DefaultFolderTemplateTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_a_default_folder_template()
    {
        $owner = User::factory()->owner()->create();

        $response = $this->actingAs($owner)->post(route('default-folder-templates.store'), [
            'name' => 'Permits',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('default_folder_templates', [
            'name' => 'Permits',
        ]);
    }

    public function test_new_default_folder_templates_are_appended_after_existing_ones()
    {
        $owner = User::factory()->owner()->create();
        DefaultFolderTemplate::factory()->create(['sort_order' => 0]);
        DefaultFolderTemplate::factory()->create(['sort_order' => 1]);

        $this->actingAs($owner)->post(route('default-folder-templates.store'), [
            'name' => 'Site Photos',
        ]);

        $this->assertDatabaseHas('default_folder_templates', [
            'name' => 'Site Photos',
            'sort_order' => 2,
        ]);
    }

    public function test_staff_cannot_create_a_default_folder_template()
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff)->post(route('default-folder-templates.store'), [
            'name' => 'Permits',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_reorder_default_folder_templates()
    {
        $owner = User::factory()->owner()->create();
        $first = DefaultFolderTemplate::factory()->create(['sort_order' => 0]);
        $second = DefaultFolderTemplate::factory()->create(['sort_order' => 1]);

        $response = $this->actingAs($owner)->post(route('default-folder-templates.reorder'), [
            'ids' => [$second->id, $first->id],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame(0, $second->fresh()->sort_order);
        $this->assertSame(1, $first->fresh()->sort_order);
    }

    public function test_owner_can_delete_a_default_folder_template()
    {
        $owner = User::factory()->owner()->create();
        $template = DefaultFolderTemplate::factory()->create();

        $response = $this->actingAs($owner)->delete(route('default-folder-templates.destroy', $template));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('default_folder_templates', ['id' => $template->id]);
    }

    public function test_new_projects_are_seeded_from_default_folder_templates_in_order()
    {
        $owner = User::factory()->owner()->create();
        DefaultFolderTemplate::query()->delete();
        DefaultFolderTemplate::factory()->create(['name' => 'Permits', 'sort_order' => 1]);
        DefaultFolderTemplate::factory()->create(['name' => 'Renders', 'sort_order' => 0]);

        $project = Project::factory()->for($owner, 'owner')->create();
        $project->seedDefaultFolders($owner);

        $this->assertSame(
            ['Renders', 'Permits'],
            $project->folders()->orderBy('id')->pluck('name')->all(),
        );
    }
}
