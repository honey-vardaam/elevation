<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class PhaseActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_viewer_can_post_a_comment()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'Looking good so far.',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'user_id' => $user->id,
            'type' => 'comment',
            'body' => 'Looking good so far.',
        ]);
    }

    public function test_viewer_can_post_a_change_request()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'change_request',
            'body' => 'Please use a warmer color palette.',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'type' => 'change_request',
        ]);
    }

    public function test_only_a_manager_can_post_an_approval()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($viewer)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'approval',
        ]);

        $response->assertForbidden();

        $manager = User::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();

        $response = $this->actingAs($manager)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'approval',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'user_id' => $manager->id,
            'type' => 'approved',
        ]);
    }

    public function test_a_reply_is_linked_to_its_parent()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'Agreed.',
            'parent_id' => $comment->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'parent_id' => $comment->id,
            'body' => 'Agreed.',
        ]);
    }

    public function test_viewer_can_attach_an_existing_project_file_to_a_comment()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $file = ProjectFile::factory()->for($project)->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'See the attached spec.',
            'attachment_id' => $file->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'attachment_id' => $file->id,
        ]);
        // Referencing the file shouldn't re-parent it to this message - it
        // stays a regular project file, browsable in its own folder.
        $this->assertNull($file->fresh()->phase_activity_id);
    }

    public function test_cannot_attach_a_file_from_another_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $otherProjectFile = ProjectFile::factory()->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'Sneaking in a file.',
            'attachment_id' => $otherProjectFile->id,
        ]);

        $response->assertSessionHasErrors('attachment_id');
    }

    public function test_a_user_without_project_access_cannot_comment()
    {
        $outsider = User::factory()->create();
        $project = Project::factory()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($outsider)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'Sneaking in.',
        ]);

        $response->assertForbidden();
    }

    public function test_manager_can_resolve_and_reopen_a_change_request()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $changeRequest = PhaseActivity::factory()->for($phase, 'projectPhase')->changeRequest()->create();

        $response = $this->actingAs($manager)->patch(route('projects.phases.activities.resolve', [$project, $phase, $changeRequest]));
        $response->assertSessionHasNoErrors();
        $this->assertNotNull($changeRequest->fresh()->resolved_at);

        $response = $this->actingAs($manager)->patch(route('projects.phases.activities.resolve', [$project, $phase, $changeRequest]));
        $response->assertSessionHasNoErrors();
        $this->assertNull($changeRequest->fresh()->resolved_at);
    }

    public function test_editor_cannot_resolve_a_change_request()
    {
        $editor = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($editor)->editor()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $changeRequest = PhaseActivity::factory()->for($phase, 'projectPhase')->changeRequest()->create();

        $response = $this->actingAs($editor)->patch(route('projects.phases.activities.resolve', [$project, $phase, $changeRequest]));

        $response->assertForbidden();
    }

    public function test_phase_from_another_project_is_not_reachable_through_a_different_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $otherProject = Project::factory()->create();
        $otherPhase = ProjectPhase::factory()->for($otherProject)->create();

        $response = $this->actingAs($user)->post(route('projects.phases.activities.store', [$project, $otherPhase]), [
            'type' => 'comment',
            'body' => 'Hijacked.',
        ]);

        $response->assertNotFound();
    }

    public function test_posting_a_comment_notifies_other_project_members_but_not_the_author()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $author = User::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $this->actingAs($author)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'comment',
            'body' => 'Looking good so far.',
        ])->assertSessionHasNoErrors();

        $this->assertDatabaseCount('notifications', 1);
        $this->assertCount(0, $author->fresh()->notifications);
        $this->assertCount(1, $owner->fresh()->notifications);
    }

    public function test_author_can_delete_their_own_comment()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($user, 'author')->create();

        $response = $this->actingAs($user)->delete(route('projects.phases.activities.destroy', [$project, $phase, $comment]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('phase_activities', ['id' => $comment->id]);
    }

    public function test_a_user_cannot_delete_someone_elses_comment()
    {
        $author = User::factory()->create();
        $otherViewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        ProjectMember::factory()->for($project)->for($otherViewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($author, 'author')->create();

        $response = $this->actingAs($otherViewer)->delete(route('projects.phases.activities.destroy', [$project, $phase, $comment]));

        $response->assertForbidden();
        $this->assertDatabaseHas('phase_activities', ['id' => $comment->id]);
    }

    public function test_a_manager_cannot_delete_someone_elses_comment()
    {
        $manager = User::factory()->create();
        $author = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($author, 'author')->create();

        $response = $this->actingAs($manager)->delete(route('projects.phases.activities.destroy', [$project, $phase, $comment]));

        $response->assertForbidden();
        $this->assertDatabaseHas('phase_activities', ['id' => $comment->id]);
    }

    public function test_deleting_a_comment_cascades_to_its_replies()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($user, 'author')->create();
        $reply = PhaseActivity::factory()->for($phase, 'projectPhase')->create(['parent_id' => $comment->id]);

        $response = $this->actingAs($user)->delete(route('projects.phases.activities.destroy', [$project, $phase, $comment]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('phase_activities', ['id' => $comment->id]);
        $this->assertDatabaseMissing('phase_activities', ['id' => $reply->id]);
    }

    public function test_deleting_a_comment_removes_an_attachment_uploaded_for_it_but_not_a_shared_project_file()
    {
        Storage::fake('local');

        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $ownAttachment = ProjectFile::factory()->for($project)->create();
        $comment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($user, 'author')->create([
            'attachment_id' => $ownAttachment->id,
        ]);
        // phase_activity_id isn't mass-assignable on ProjectFile (mirrors
        // how the controller itself sets it via a query builder update).
        ProjectFile::where('id', $ownAttachment->id)->update(['phase_activity_id' => $comment->id]);

        $sharedFile = ProjectFile::factory()->for($project)->create();
        $sharedComment = PhaseActivity::factory()->for($phase, 'projectPhase')->for($user, 'author')->create([
            'attachment_id' => $sharedFile->id,
        ]);

        $this->actingAs($user)->delete(route('projects.phases.activities.destroy', [$project, $phase, $comment]))
            ->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('project_files', ['id' => $ownAttachment->id]);

        $this->actingAs($user)->delete(route('projects.phases.activities.destroy', [$project, $phase, $sharedComment]))
            ->assertSessionHasNoErrors();
        $this->assertDatabaseHas('project_files', ['id' => $sharedFile->id]);
    }

    public function test_resolving_a_change_request_notifies_its_author()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $author = User::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $changeRequest = PhaseActivity::factory()->for($phase, 'projectPhase')->for($author, 'author')->changeRequest()->create();

        $this->actingAs($manager)->patch(route('projects.phases.activities.resolve', [$project, $phase, $changeRequest]))
            ->assertSessionHasNoErrors();

        $this->assertCount(1, $author->fresh()->notifications);
    }
}
