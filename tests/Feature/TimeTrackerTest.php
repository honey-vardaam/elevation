<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TimeTrackerTest extends TestCase
{
    use RefreshDatabase;

    public function test_starting_a_new_entry_stops_any_currently_running_entry_for_that_user()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $running = TimeEntry::factory()->for($user)->for($project)->running()->create();

        $response = $this->actingAs($user)->post(route('time-tracker.store'), [
            'project_id' => $project->id,
            'task' => 'New task',
        ]);

        $response->assertRedirect();
        $this->assertNotNull($running->fresh()->ended_at);
        $this->assertDatabaseHas('time_entries', [
            'user_id' => $user->id,
            'task' => 'New task',
            'ended_at' => null,
        ]);
    }

    public function test_a_user_cannot_stop_someone_elses_entry()
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $entry = TimeEntry::factory()->for($owner)->for($project)->running()->create();

        $response = $this->actingAs($other)->post(route('time-tracker.stop', $entry));

        $response->assertForbidden();
    }

    public function test_stopping_an_already_stopped_entry_404s()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->create(['ended_at' => now()]);

        $response = $this->actingAs($user)->post(route('time-tracker.stop', $entry));

        $response->assertNotFound();
    }

    public function test_picking_a_project_the_user_has_no_access_to_is_rejected()
    {
        $user = User::factory()->create();
        $foreignProject = Project::factory()->create();

        $response = $this->actingAs($user)->post(route('time-tracker.store'), [
            'project_id' => $foreignProject->id,
            'task' => 'New task',
        ]);

        $response->assertSessionHasErrors('project_id');
    }
}
