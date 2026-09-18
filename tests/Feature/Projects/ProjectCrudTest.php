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

    public function test_owner_can_create_a_project()
    {
        $user = User::factory()->owner()->create();

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

    public function test_owner_can_update_dates_status_and_client_details()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create(['status' => 'ongoing']);

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'name' => $project->name,
            'status' => 'on_hold',
            'start_date' => '2026-01-05',
            'end_date' => '2026-06-30',
            'client_name' => 'The Whitfield Family',
            'client_email' => 'client@example.com',
            'client_phone' => '555-0142',
            'site_address' => '12 Harborview Lane',
        ]);

        $response->assertSessionHasNoErrors();
        $fresh = $project->fresh();
        $this->assertSame('on_hold', $fresh->status->value);
        $this->assertSame('2026-01-05', $fresh->start_date->toDateString());
        $this->assertSame('2026-06-30', $fresh->end_date->toDateString());
        $this->assertSame('The Whitfield Family', $fresh->client_name);
        $this->assertSame('client@example.com', $fresh->client_email);
        $this->assertSame('555-0142', $fresh->client_phone);
        $this->assertSame('12 Harborview Lane', $fresh->site_address);
    }

    public function test_owner_can_change_status_without_resending_other_fields()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create(['status' => 'ongoing']);

        $response = $this->actingAs($user)->patch(route('projects.update', $project), [
            'status' => 'on_hold',
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertSame('on_hold', $project->fresh()->status->value);
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
