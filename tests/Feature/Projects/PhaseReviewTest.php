<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhaseReviewTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_member_can_open_a_request_tagging_a_reviewer()
    {
        $author = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->manager()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($author)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'change_request',
            'body' => 'Please check the floor plan revision.',
            'reviewer_id' => $reviewer->id,
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('phase_activities', [
            'project_phase_id' => $phase->id,
            'user_id' => $author->id,
            'type' => 'change_request',
            'reviewer_id' => $reviewer->id,
            'activity_status' => 'open',
        ]);
    }

    public function test_tagging_a_reviewer_with_no_project_access_is_rejected()
    {
        $author = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $outsider = User::factory()->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $response = $this->actingAs($author)->post(route('projects.phases.activities.store', [$project, $phase]), [
            'type' => 'change_request',
            'body' => 'Please check this.',
            'reviewer_id' => $outsider->id,
        ]);

        $response->assertSessionHasErrors('reviewer_id');
    }

    public function test_the_tagged_reviewer_can_approve()
    {
        $reviewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($reviewer)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'approved',
        ]);

        $response->assertSessionHasNoErrors();
        $request->refresh();
        $this->assertSame('resolved', $request->activity_status->value);
        $this->assertNotNull($request->resolved_at);
        $this->assertSame($reviewer->id, $request->resolved_by);
    }

    public function test_the_tagged_reviewer_can_request_changes_with_a_note()
    {
        $reviewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($reviewer)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'changes_requested',
            'note' => 'Please adjust the elevation heights.',
        ]);

        $response->assertSessionHasNoErrors();
        $request->refresh();
        $this->assertSame('changes_requested', $request->activity_status->value);
        $this->assertNull($request->resolved_at);
        $this->assertDatabaseHas('phase_activities', [
            'parent_id' => $request->id,
            'body' => 'Please adjust the elevation heights.',
            'type' => 'comment',
        ]);
    }

    public function test_requesting_changes_without_a_note_is_rejected()
    {
        $reviewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($reviewer)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'changes_requested',
        ]);

        $response->assertSessionHasErrors('note');
    }

    public function test_a_manager_who_is_not_the_tagged_reviewer_can_also_decide()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($manager)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'approved',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('resolved', $request->fresh()->activity_status->value);
    }

    public function test_an_unrelated_member_cannot_decide()
    {
        $bystander = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($bystander)->editor()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($bystander)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'approved',
        ]);

        $response->assertForbidden();
    }

    public function test_deciding_an_already_approved_request_is_rejected()
    {
        $reviewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create([
            'activity_status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $reviewer->id,
        ]);

        $response = $this->actingAs($reviewer)->patch(route('projects.phases.activities.decide', [$project, $phase, $request]), [
            'decision' => 'changes_requested',
            'note' => 'Too late.',
        ]);

        $response->assertNotFound();
    }

    public function test_resolve_endpoint_cannot_close_a_request_that_has_a_reviewer()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create();

        $response = $this->actingAs($manager)->patch(route('projects.phases.activities.resolve', [$project, $phase, $request]));

        $response->assertNotFound();
        $this->assertSame('open', $request->fresh()->activity_status->value);
    }

    public function test_manager_can_reopen_a_reviewer_approved_request()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create([
            'activity_status' => 'resolved',
            'resolved_at' => now(),
            'resolved_by' => $reviewer->id,
        ]);

        $response = $this->actingAs($manager)->patch(route('projects.phases.activities.resolve', [$project, $phase, $request]));

        $response->assertSessionHasNoErrors();
        $request->refresh();
        $this->assertSame('open', $request->activity_status->value);
        $this->assertNull($request->resolved_at);
    }

    public function test_author_can_resubmit_after_changes_requested_and_it_goes_back_to_open()
    {
        $author = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create([
            'user_id' => $author->id,
            'activity_status' => 'changes_requested',
        ]);

        $response = $this->actingAs($author)->post(route('projects.phases.activities.resubmit', [$project, $phase, $request]));

        $response->assertSessionHasNoErrors();
        $this->assertSame('open', $request->fresh()->activity_status->value);
    }

    public function test_only_author_or_manager_can_resubmit()
    {
        $author = User::factory()->create();
        $bystander = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        ProjectMember::factory()->for($project)->for($bystander)->editor()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create([
            'user_id' => $author->id,
            'activity_status' => 'changes_requested',
        ]);

        $response = $this->actingAs($bystander)->post(route('projects.phases.activities.resubmit', [$project, $phase, $request]));

        $response->assertForbidden();
    }

    public function test_resubmit_only_works_from_changes_requested_state()
    {
        $author = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $reviewer = User::factory()->create();
        ProjectMember::factory()->for($project)->for($reviewer)->viewer()->create();
        $phase = ProjectPhase::factory()->for($project)->create();
        $request = PhaseActivity::factory()->for($phase, 'projectPhase')->review($reviewer)->create([
            'user_id' => $author->id,
            'activity_status' => 'open',
        ]);

        $response = $this->actingAs($author)->post(route('projects.phases.activities.resubmit', [$project, $phase, $request]));

        $response->assertNotFound();
    }

    public function test_a_request_from_another_project_is_not_reachable_through_a_different_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $otherProject = Project::factory()->create();
        $otherPhase = ProjectPhase::factory()->for($otherProject)->create();
        $otherRequest = PhaseActivity::factory()->for($otherPhase, 'projectPhase')->review()->create();

        $response = $this->actingAs($user)->patch(route('projects.phases.activities.decide', [$project, $otherPhase, $otherRequest]), [
            'decision' => 'approved',
        ]);

        $response->assertNotFound();
    }
}
