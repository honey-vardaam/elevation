<?php

namespace Tests\Feature\Projects;

use App\Models\Folder;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectFileTest extends TestCase
{
    use RefreshDatabase;

    public function test_editor_can_upload_a_file()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();

        $response = $this->actingAs($user)->post(route('projects.files.store', $project), [
            'file' => UploadedFile::fake()->create('site-plan.pdf', 500),
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('project_files', [
            'project_id' => $project->id,
            'name' => 'site-plan.pdf',
            'uploaded_by' => $user->id,
        ]);

        $file = ProjectFile::where('project_id', $project->id)->firstOrFail();
        Storage::disk('local')->assertExists($file->path);
    }

    public function test_viewer_cannot_upload_a_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        $response = $this->actingAs($user)->post(route('projects.files.store', $project), [
            'file' => UploadedFile::fake()->create('site-plan.pdf', 500),
        ]);

        $response->assertForbidden();
    }

    public function test_oversized_upload_is_rejected()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        $response = $this->actingAs($user)->post(route('projects.files.store', $project), [
            // 102401 KB > the 102400 KB (100MB) limit
            'file' => UploadedFile::fake()->create('huge-render.png', 102401),
        ]);

        $response->assertSessionHasErrors('file');
    }

    public function test_editor_can_rename_and_move_a_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $folder = Folder::factory()->for($project)->create();
        $file = ProjectFile::factory()->for($project)->create();

        $response = $this->actingAs($user)->patch(route('projects.files.update', [$project, $file]), [
            'name' => 'renamed.pdf',
            'folder_id' => $folder->id,
        ]);

        $response->assertSessionHasNoErrors();
        $file->refresh();
        $this->assertSame('renamed.pdf', $file->name);
        $this->assertSame($folder->id, $file->folder_id);
    }

    public function test_viewer_cannot_delete_a_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $file = ProjectFile::factory()->for($project)->create();

        $response = $this->actingAs($user)->delete(route('projects.files.destroy', [$project, $file]));

        $response->assertForbidden();
        $this->assertDatabaseHas('project_files', ['id' => $file->id]);
    }

    public function test_manager_can_delete_a_file_and_its_disk_object()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();
        $file = ProjectFile::factory()->for($project)->create(['path' => 'projects/1/plan.pdf']);
        Storage::disk('local')->put($file->path, 'content');

        $response = $this->actingAs($user)->delete(route('projects.files.destroy', [$project, $file]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('project_files', ['id' => $file->id]);
        Storage::disk('local')->assertMissing($file->path);
    }

    public function test_viewer_can_download_a_file()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $file = ProjectFile::factory()->for($project)->create(['name' => 'plan.pdf', 'path' => 'projects/1/plan.pdf']);
        Storage::disk('local')->put($file->path, 'file content');

        $response = $this->actingAs($user)->get(route('projects.files.download', [$project, $file]));

        $response->assertOk();
        $response->assertHeader('content-disposition', 'attachment; filename=plan.pdf');
    }

    public function test_non_member_cannot_download_a_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $file = ProjectFile::factory()->for($project)->create();

        $response = $this->actingAs($user)->get(route('projects.files.download', [$project, $file]));

        $response->assertForbidden();
    }
}
