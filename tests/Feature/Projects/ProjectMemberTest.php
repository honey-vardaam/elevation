<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectMemberTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_add_a_member_by_email()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $invitee = User::factory()->create();

        $response = $this->actingAs($owner)->post(route('projects.members.store', $project), [
            'email' => $invitee->email,
            'role' => 'editor',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('project_members', [
            'project_id' => $project->id,
            'user_id' => $invitee->id,
            'role' => 'editor',
        ]);
    }

    public function test_manager_can_add_a_member()
    {
        $manager = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($manager)->manager()->create();
        $invitee = User::factory()->create();

        $response = $this->actingAs($manager)->post(route('projects.members.store', $project), [
            'email' => $invitee->email,
            'role' => 'viewer',
        ]);

        $response->assertSessionHasNoErrors();
    }

    public function test_editor_cannot_add_a_member()
    {
        $editor = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($editor)->editor()->create();
        $invitee = User::factory()->create();

        $response = $this->actingAs($editor)->post(route('projects.members.store', $project), [
            'email' => $invitee->email,
            'role' => 'viewer',
        ]);

        $response->assertForbidden();
    }

    public function test_viewer_cannot_add_a_member()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $invitee = User::factory()->create();

        $response = $this->actingAs($viewer)->post(route('projects.members.store', $project), [
            'email' => $invitee->email,
            'role' => 'viewer',
        ]);

        $response->assertForbidden();
    }

    public function test_nonexistent_email_is_rejected()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();

        $response = $this->actingAs($owner)->post(route('projects.members.store', $project), [
            'email' => 'nobody@example.com',
            'role' => 'viewer',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_already_a_member_is_rejected()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $member = User::factory()->create();
        ProjectMember::factory()->for($project)->for($member)->viewer()->create();

        $response = $this->actingAs($owner)->post(route('projects.members.store', $project), [
            'email' => $member->email,
            'role' => 'editor',
        ]);

        $response->assertSessionHasErrors('email');
    }

    public function test_owner_can_update_a_members_role()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $member = ProjectMember::factory()->for($project)->viewer()->create();

        $response = $this->actingAs($owner)->patch(route('projects.members.update', [$project, $member]), [
            'role' => 'editor',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('editor', $member->fresh()->role->value);
    }

    public function test_owner_can_remove_a_member()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $member = ProjectMember::factory()->for($project)->viewer()->create();

        $response = $this->actingAs($owner)->delete(route('projects.members.destroy', [$project, $member]));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('project_members', ['id' => $member->id]);
    }

    public function test_viewer_cannot_remove_a_member()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $otherMember = ProjectMember::factory()->for($project)->editor()->create();

        $response = $this->actingAs($viewer)->delete(route('projects.members.destroy', [$project, $otherMember]));

        $response->assertForbidden();
        $this->assertDatabaseHas('project_members', ['id' => $otherMember->id]);
    }
}
