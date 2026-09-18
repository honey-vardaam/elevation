<?php

namespace Tests\Feature;

use App\Models\Moodboard;
use App\Models\MoodboardElement;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Tests\TestCase;

class MoodboardTest extends TestCase
{
    use RefreshDatabase;

    private function element(array $overrides = []): array
    {
        return [
            'id' => (string) Str::uuid(),
            'type' => 'note',
            'x' => 10,
            'y' => 20,
            'width' => 200,
            'height' => 150,
            'z_index' => 1,
            'data' => ['text' => 'Hello', 'color' => 'yellow'],
            ...$overrides,
        ];
    }

    public function test_any_user_can_create_a_personal_moodboard()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('moodboards.store'), ['title' => 'Ideas']);

        $moodboard = Moodboard::firstOrFail();
        $response->assertRedirect(route('moodboards.show', $moodboard));
        $this->assertNull($moodboard->project_id);
        $this->assertSame($user->id, $moodboard->user_id);
    }

    public function test_a_project_manager_can_create_a_project_moodboard()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();

        $this->actingAs($user)->post(route('moodboards.store'), [
            'title' => 'Handover',
            'project_id' => $project->id,
        ])->assertSessionHasNoErrors();

        $this->assertSame($project->id, Moodboard::firstOrFail()->project_id);
    }

    public function test_a_project_viewer_cannot_create_a_project_moodboard()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        $this->actingAs($user)->post(route('moodboards.store'), [
            'title' => 'Handover',
            'project_id' => $project->id,
        ])->assertSessionHasErrors('project_id');

        $this->assertSame(0, Moodboard::count());
    }

    public function test_a_personal_moodboard_is_private_to_its_creator()
    {
        $moodboard = Moodboard::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('moodboards.show', $moodboard))
            ->assertForbidden();
    }

    public function test_project_members_with_access_can_edit_a_project_moodboard()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $moodboard = Moodboard::factory()->for($project)->create();

        $this->actingAs($viewer)->get(route('moodboards.show', $moodboard))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can.update', true));
    }

    public function test_project_members_with_access_can_edit_the_canvas()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $moodboard = Moodboard::factory()->for($project)->create();

        $this->actingAs($viewer)
            ->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$this->element()]])
            ->assertOk();
    }

    public function test_users_without_project_access_cannot_edit_the_canvas()
    {
        $outsider = User::factory()->create();
        $project = Project::factory()->create();
        $moodboard = Moodboard::factory()->for($project)->create();

        $this->actingAs($outsider)
            ->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$this->element()]])
            ->assertForbidden();
    }

    public function test_personal_moodboard_can_be_shared_to_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $moodboard = Moodboard::factory()->for($user)->create();

        $this->actingAs($user)
            ->patch(route('moodboards.update', $moodboard), ['project_id' => $project->id])
            ->assertRedirect();

        $this->assertSame($project->id, $moodboard->fresh()->project_id);
    }

    public function test_the_project_owner_can_edit_a_project_moodboard_created_by_someone_else()
    {
        $project = Project::factory()->create();
        $moodboard = Moodboard::factory()->for($project)->create();

        $this->actingAs($project->owner)->get(route('moodboards.show', $moodboard))
            ->assertInertia(fn ($page) => $page->where('can.update', true));
    }

    public function test_index_lists_personal_and_accessible_project_moodboards_only()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        Moodboard::factory()->for($user)->create(['title' => 'Mine']);
        Moodboard::factory()->for($project)->create(['title' => 'Project board']);
        Moodboard::factory()->create(['title' => 'Someone else personal']);
        Moodboard::factory()->for(Project::factory())->create(['title' => 'Other project']);

        $this->actingAs($user)->get(route('moodboards.index'))
            ->assertInertia(fn ($page) => $page
                ->has('moodboards', 2)
                ->where('moodboards', fn ($moodboards) => collect($moodboards)->pluck('title')->sort()->values()->all() === ['Mine', 'Project board']));
    }

    public function test_syncing_the_canvas_creates_updates_and_deletes_elements()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();
        $kept = $this->element();
        $dropped = $this->element();

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$kept, $dropped]])->assertOk();
        $this->assertSame(2, $moodboard->elements()->count());

        $kept['x'] = 500;
        $kept['data']['text'] = 'Updated';
        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$kept]])->assertOk();

        $this->assertSame(1, $moodboard->elements()->count());
        $element = MoodboardElement::findOrFail($kept['id']);
        $this->assertSame(500.0, $element->x);
        $this->assertSame('Updated', $element->data['text']);
    }

    public function test_moving_and_resizing_an_element_is_persisted()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();
        $element = $this->element(['type' => 'text', 'data' => ['text' => 'Hello', 'size' => 'lg']]);

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$element]])->assertOk();

        $moved = [...$element, 'x' => 340, 'y' => 220, 'width' => 320, 'height' => 90];
        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$moved]])->assertOk();

        $saved = MoodboardElement::findOrFail($element['id']);
        $this->assertSame(340.0, $saved->x);
        $this->assertSame(220.0, $saved->y);
        $this->assertSame(320.0, $saved->width);
        $this->assertSame(90.0, $saved->height);
    }

    public function test_a_sections_color_can_be_changed()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();
        $section = $this->element(['type' => 'section', 'data' => ['title' => 'Palette', 'color' => 'gray']]);

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$section]])->assertOk();

        $recolored = [...$section, 'data' => ['title' => 'Palette', 'color' => 'blue']];
        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$recolored]])->assertOk();

        $this->assertSame('blue', MoodboardElement::findOrFail($section['id'])->data['color']);
    }

    public function test_moodboard_checklist_items_are_stored_and_counted()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [
            $this->element(['type' => 'checklist', 'data' => ['title' => 'Site visit', 'items' => [
                ['id' => 'a', 'text' => 'Measure', 'done' => true],
                ['id' => 'b', 'text' => 'Photos', 'done' => false],
            ]]]),
        ]])->assertOk();

        $this->actingAs($user)->get(route('moodboards.index'))
            ->assertInertia(fn ($page) => $page
                ->where('moodboards.0.items_total', 2)
                ->where('moodboards.0.items_done', 1));
    }

    public function test_an_element_id_from_another_board_cannot_be_hijacked()
    {
        $user = User::factory()->create();
        $mine = Moodboard::factory()->for($user)->create();
        $theirs = Moodboard::factory()->create();
        $foreign = $this->element();

        $this->actingAs($theirs->user)->putJson(route('moodboards.canvas', $theirs), ['elements' => [$foreign]])->assertOk();

        $this->actingAs($user)
            ->putJson(route('moodboards.canvas', $mine), ['elements' => [$this->element(['id' => $foreign['id']])]])
            ->assertUnprocessable();

        $this->assertSame($theirs->id, MoodboardElement::findOrFail($foreign['id'])->moodboard_id);
    }

    public function test_image_paths_outside_the_boards_directory_are_discarded()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();
        $element = $this->element(['type' => 'image', 'data' => ['path' => 'company/logo.png']]);

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => [$element]])->assertOk();

        $this->assertSame([], MoodboardElement::findOrFail($element['id'])->data);
    }

    public function test_uploading_an_image_and_removing_it_from_the_board_deletes_the_file()
    {
        Storage::fake('public');
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();

        $path = $this->actingAs($user)
            ->post(route('moodboards.images.store', $moodboard), ['image' => UploadedFile::fake()->image('ref.jpg')])
            ->assertOk()
            ->json('path');

        Storage::disk('public')->assertExists($path);

        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), [
            'elements' => [$this->element(['type' => 'image', 'data' => ['path' => $path]])],
        ])->assertOk();
        $this->actingAs($user)->putJson(route('moodboards.canvas', $moodboard), ['elements' => []])->assertOk();

        Storage::disk('public')->assertMissing($path);
    }

    public function test_the_owner_can_rename_and_delete_a_moodboard()
    {
        $user = User::factory()->create();
        $moodboard = Moodboard::factory()->for($user)->create();

        $this->actingAs($user)->patch(route('moodboards.update', $moodboard), ['title' => 'Renamed']);
        $this->assertSame('Renamed', $moodboard->fresh()->title);

        $this->actingAs($user)->delete(route('moodboards.destroy', $moodboard))->assertRedirect(route('moodboards.index'));
        $this->assertModelMissing($moodboard);
    }
}
