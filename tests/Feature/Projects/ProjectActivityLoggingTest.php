<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ProjectActivityLoggingTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_a_project_logs_project_created()
    {
        $owner = User::factory()->owner()->create();

        $response = $this->actingAs($owner)->post(route('projects.store'), [
            'name' => 'New Build',
        ]);

        $response->assertSessionHasNoErrors();
        $project = Project::where('name', 'New Build')->firstOrFail();

        $this->assertDatabaseHas('project_activities', [
            'project_id' => $project->id,
            'causer_id' => $owner->id,
            'type' => 'project_created',
        ]);
    }

    public function test_changing_project_status_logs_project_status_changed()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create(['status' => 'ongoing']);

        $response = $this->actingAs($owner)->patch(route('projects.update', $project), [
            'status' => 'on_hold',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('project_activities', [
            'project_id' => $project->id,
            'type' => 'project_status_changed',
        ]);

        $activity = $project->activities()->where('type', 'project_status_changed')->firstOrFail();
        $this->assertSame(['from' => 'ongoing', 'to' => 'on_hold'], $activity->meta);
    }

    public function test_updating_project_without_status_change_logs_nothing()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create(['status' => 'ongoing']);

        $this->actingAs($owner)->patch(route('projects.update', $project), [
            'name' => $project->name,
            'status' => 'ongoing',
        ]);

        $this->assertDatabaseMissing('project_activities', [
            'project_id' => $project->id,
            'type' => 'project_status_changed',
        ]);
    }

    public function test_adding_a_member_logs_member_added()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $invitee = User::factory()->create(['name' => 'Jamie Lee']);

        $this->actingAs($owner)->post(route('projects.members.store', $project), [
            'email' => $invitee->email,
            'role' => 'editor',
        ]);

        $activity = $project->activities()->where('type', 'member_added')->firstOrFail();
        $this->assertSame(['name' => 'Jamie Lee', 'role' => 'editor'], $activity->meta);
    }

    public function test_changing_a_members_role_logs_member_role_changed()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $member = ProjectMember::factory()->for($project)->viewer()->create();
        $member->user->update(['name' => 'Sam Rivera']);

        $this->actingAs($owner)->patch(route('projects.members.update', [$project, $member]), [
            'role' => 'editor',
        ]);

        $activity = $project->activities()->where('type', 'member_role_changed')->firstOrFail();
        $this->assertSame(['name' => 'Sam Rivera', 'from' => 'viewer', 'to' => 'editor'], $activity->meta);
    }

    public function test_removing_a_member_logs_member_removed_with_name_preserved()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $member = ProjectMember::factory()->for($project)->viewer()->create();
        $member->user->update(['name' => 'Alex Chen']);

        $this->actingAs($owner)->delete(route('projects.members.destroy', [$project, $member]));

        $this->assertDatabaseMissing('project_members', ['id' => $member->id]);

        $activity = $project->activities()->where('type', 'member_removed')->firstOrFail();
        $this->assertSame(['name' => 'Alex Chen', 'role' => 'viewer'], $activity->meta);
    }

    public function test_uploading_a_file_logs_file_uploaded()
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();

        $this->actingAs($owner)->post(route('projects.files.store', $project), [
            'file' => UploadedFile::fake()->create('site-plan.pdf', 500),
        ]);

        $activity = $project->activities()->where('type', 'file_uploaded')->firstOrFail();
        $this->assertSame(['name' => 'site-plan.pdf'], $activity->meta);
        $this->assertSame('site-plan.pdf', $activity->subject->name);
    }

    public function test_renaming_a_file_logs_file_updated()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $file = ProjectFile::factory()->for($project)->create(['name' => 'old.pdf']);

        $this->actingAs($owner)->patch(route('projects.files.update', [$project, $file]), [
            'name' => 'new.pdf',
        ]);

        $activity = $project->activities()->where('type', 'file_updated')->firstOrFail();
        $this->assertTrue($activity->meta['renamed']);
        $this->assertFalse($activity->meta['moved']);
        $this->assertSame('old.pdf', $activity->meta['old_name']);
        $this->assertSame('new.pdf', $activity->meta['new_name']);
    }

    public function test_deleting_a_file_logs_file_deleted_with_name_preserved()
    {
        Storage::fake('local');

        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $file = ProjectFile::factory()->for($project)->create(['name' => 'plan.pdf', 'path' => 'projects/1/plan.pdf']);
        Storage::disk('local')->put($file->path, 'content');

        $this->actingAs($owner)->delete(route('projects.files.destroy', [$project, $file]));

        $this->assertDatabaseMissing('project_files', ['id' => $file->id]);

        $activity = $project->activities()->where('type', 'file_deleted')->firstOrFail();
        $this->assertSame(['name' => 'plan.pdf'], $activity->meta);
    }
}
