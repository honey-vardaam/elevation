<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
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
}
