<?php

namespace Tests\Feature\Projects;

use App\Models\Folder;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class FolderTest extends TestCase
{
    use RefreshDatabase;

    public function test_editor_can_create_a_nested_folder()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $parent = Folder::factory()->for($project)->create();

        $response = $this->actingAs($user)->post(route('projects.folders.store', $project), [
            'name' => 'Revisions',
            'parent_id' => $parent->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('folders', [
            'project_id' => $project->id,
            'parent_id' => $parent->id,
            'name' => 'Revisions',
        ]);
    }

    public function test_viewer_cannot_create_a_folder()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        $response = $this->actingAs($user)->post(route('projects.folders.store', $project), [
            'name' => 'Plans',
        ]);

        $response->assertForbidden();
    }

    public function test_duplicate_root_folder_name_is_rejected()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        Folder::factory()->for($project)->create(['name' => 'Plans', 'parent_id' => null]);

        $response = $this->actingAs($user)->post(route('projects.folders.store', $project), [
            'name' => 'Plans',
        ]);

        $response->assertSessionHasErrors('name');
    }

    public function test_same_folder_name_allowed_under_different_parents()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $parentA = Folder::factory()->for($project)->create(['name' => 'A']);
        Folder::factory()->for($project)->create(['name' => 'Revisions', 'parent_id' => $parentA->id]);
        $parentB = Folder::factory()->for($project)->create(['name' => 'B']);

        $response = $this->actingAs($user)->post(route('projects.folders.store', $project), [
            'name' => 'Revisions',
            'parent_id' => $parentB->id,
        ]);

        $response->assertSessionHasNoErrors();
    }

    public function test_folder_cannot_be_moved_into_itself()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $folder = Folder::factory()->for($project)->create();

        $response = $this->actingAs($user)->patch(route('projects.folders.update', [$project, $folder]), [
            'name' => $folder->name,
            'parent_id' => $folder->id,
        ]);

        $response->assertSessionHasErrors('parent_id');
    }

    public function test_folder_cannot_be_moved_into_its_own_descendant()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $grandparent = Folder::factory()->for($project)->create(['name' => 'Grandparent']);
        $parent = Folder::factory()->for($project)->create(['name' => 'Parent', 'parent_id' => $grandparent->id]);
        $child = Folder::factory()->for($project)->create(['name' => 'Child', 'parent_id' => $parent->id]);

        $response = $this->actingAs($user)->patch(route('projects.folders.update', [$project, $grandparent]), [
            'name' => $grandparent->name,
            'parent_id' => $child->id,
        ]);

        $response->assertSessionHasErrors('parent_id');
    }

    public function test_editor_can_rename_and_move_a_folder()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $newParent = Folder::factory()->for($project)->create();
        $folder = Folder::factory()->for($project)->create();

        $response = $this->actingAs($user)->patch(route('projects.folders.update', [$project, $folder]), [
            'name' => 'Renamed',
            'parent_id' => $newParent->id,
        ]);

        $response->assertSessionHasNoErrors();
        $folder->refresh();
        $this->assertSame('Renamed', $folder->name);
        $this->assertSame($newParent->id, $folder->parent_id);
    }

    public function test_viewer_cannot_delete_a_folder()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $folder = Folder::factory()->for($project)->create();

        $response = $this->actingAs($user)->delete(route('projects.folders.destroy', [$project, $folder]));

        $response->assertForbidden();
        $this->assertDatabaseHas('folders', ['id' => $folder->id]);
    }

    public function test_manager_deleting_a_folder_cascades_to_children_and_their_files()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();

        $parent = Folder::factory()->for($project)->create();
        $child = Folder::factory()->childOf($parent)->create();
        $fileInParent = ProjectFile::factory()->for($project)->create(['folder_id' => $parent->id, 'path' => 'projects/1/parent.pdf']);
        $fileInChild = ProjectFile::factory()->for($project)->create(['folder_id' => $child->id, 'path' => 'projects/1/child.pdf']);

        Storage::disk('local')->put($fileInParent->path, 'content');
        Storage::disk('local')->put($fileInChild->path, 'content');

        $response = $this->actingAs($user)->delete(route('projects.folders.destroy', [$project, $parent]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('folders', ['id' => $parent->id]);
        $this->assertDatabaseMissing('folders', ['id' => $child->id]);
        $this->assertDatabaseMissing('project_files', ['id' => $fileInParent->id]);
        $this->assertDatabaseMissing('project_files', ['id' => $fileInChild->id]);
        Storage::disk('local')->assertMissing($fileInParent->path);
        Storage::disk('local')->assertMissing($fileInChild->path);
    }

    public function test_folder_from_another_project_is_not_reachable_through_a_different_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $otherProject = Project::factory()->create();
        $otherFolder = Folder::factory()->for($otherProject)->create();

        $response = $this->actingAs($user)->patch(route('projects.folders.update', [$project, $otherFolder]), [
            'name' => 'Hijacked',
        ]);

        $response->assertNotFound();
    }
}
