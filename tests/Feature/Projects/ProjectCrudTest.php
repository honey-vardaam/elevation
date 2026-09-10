<?php

namespace Tests\Feature\Projects;

use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectCrudTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_only_shows_owned_and_member_projects()
    {
        $user = User::factory()->create();
        $owned = Project::factory()->for($user, 'owner')->create(['name' => 'Owned Project']);
        $shared = Project::factory()->create(['name' => 'Shared Project']);
        ProjectMember::factory()->for($shared)->for($user)->viewer()->create();
        $inaccessible = Project::factory()->create(['name' => 'Inaccessible Project']);

        $response = $this->actingAs($user)->get(route('projects.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->component('projects/index')
            ->has('projects', 2)
        );
        $response->assertSee($owned->name);
        $response->assertSee($shared->name);
        $response->assertDontSee($inaccessible->name);
    }

    public function test_authenticated_user_can_create_a_project()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('projects.store'), [
            'name' => 'New Headquarters',
            'description' => 'A brand new office building.',
        ]);

        $response->assertSessionHasNoErrors();

        $this->assertDatabaseHas('projects', [
            'name' => 'New Headquarters',
            'owner_id' => $user->id,
        ]);
    }

    public function test_owner_can_view_their_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        $response = $this->actingAs($user)->get(route('projects.show', $project));

        $response->assertOk();
    }

    public function test_non_member_cannot_view_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($user)->get(route('projects.show', $project));

        $response->assertForbidden();
    }

    public function test_owner_can_update_their_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'name' => 'Renamed Project',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('Renamed Project', $project->fresh()->name);
    }

    public function test_manager_can_update_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'name' => 'Renamed Project',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('Renamed Project', $project->fresh()->name);
    }

    public function test_editor_cannot_update_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'name' => 'Renamed Project',
        ]);

        $response->assertForbidden();
    }

    public function test_viewer_cannot_update_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'name' => 'Renamed Project',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_delete_their_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();

        $response = $this->actingAs($user)->delete(route('projects.destroy', $project));

        $response->assertRedirect(route('projects.index'));
        $this->assertDatabaseMissing('projects', ['id' => $project->id]);
    }

    public function test_manager_cannot_delete_a_project()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->manager()->create();

        $response = $this->actingAs($user)->delete(route('projects.destroy', $project));

        $response->assertForbidden();
        $this->assertDatabaseHas('projects', ['id' => $project->id]);
    }
}
