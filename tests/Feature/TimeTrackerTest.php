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

    public function test_a_user_can_pause_their_running_entry()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->running()->create();

        $response = $this->actingAs($user)->post(route('time-tracker.pause', $entry));

        $response->assertRedirect();
        $entry->refresh();
        $this->assertNotNull($entry->paused_at);
        $this->assertNull($entry->ended_at);
    }

    public function test_pausing_an_already_paused_entry_404s()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->paused()->create();

        $response = $this->actingAs($user)->post(route('time-tracker.pause', $entry));

        $response->assertNotFound();
    }

    public function test_resuming_a_paused_entry_shifts_started_at_by_the_paused_duration()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => now()->subMinutes(10),
            'paused_at' => now()->subMinutes(4),
            'ended_at' => null,
        ]);

        $response = $this->actingAs($user)->post(route('time-tracker.resume', $entry));

        $response->assertRedirect();
        $entry->refresh();
        $this->assertNull($entry->paused_at);
        $this->assertNull($entry->ended_at);
        // ~4 minutes (240s) of pause time should have been added back onto
        // started_at, so the entry now reads as having run ~6 minutes.
        $this->assertEqualsWithDelta(360, $entry->durationInSeconds(), 5);
    }

    public function test_resuming_a_running_entry_404s()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->running()->create();

        $response = $this->actingAs($user)->post(route('time-tracker.resume', $entry));

        $response->assertNotFound();
    }

    public function test_a_user_cannot_pause_someone_elses_entry()
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $entry = TimeEntry::factory()->for($owner)->for($project)->running()->create();

        $response = $this->actingAs($other)->post(route('time-tracker.pause', $entry));

        $response->assertForbidden();
    }

    public function test_stopping_a_paused_entry_freezes_its_duration_at_the_pause_point()
    {
        $user = User::factory()->create();
        $project = Project::factory()->for($user, 'owner')->create();
        $entry = TimeEntry::factory()->for($user)->for($project)->create([
            'started_at' => now()->subMinutes(10),
            'paused_at' => now()->subMinutes(4),
            'ended_at' => null,
        ]);

        $response = $this->actingAs($user)->post(route('time-tracker.stop', $entry));

        $response->assertRedirect();
        $entry->refresh();
        $this->assertNotNull($entry->ended_at);
        $this->assertEqualsWithDelta(360, $entry->durationInSeconds(), 5);
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
