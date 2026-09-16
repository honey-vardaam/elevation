<?php

namespace Tests\Feature\Settings;

use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TeamTest extends TestCase
{
    use RefreshDatabase;

    public function test_owner_can_create_a_team_with_members()
    {
        $owner = User::factory()->owner()->create();
        $staffOne = User::factory()->create();
        $staffTwo = User::factory()->create();

        $response = $this->actingAs($owner)->post(route('teams.store'), [
            'name' => 'Structural Team',
            'description' => 'Handles structural engineering review.',
            'member_ids' => [$staffOne->id, $staffTwo->id],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('teams', ['name' => 'Structural Team']);

        $team = Team::firstWhere('name', 'Structural Team');
        $this->assertSame(2, $team->members()->count());
        $this->assertDatabaseHas('team_members', ['team_id' => $team->id, 'user_id' => $staffOne->id]);
        $this->assertDatabaseHas('team_members', ['team_id' => $team->id, 'user_id' => $staffTwo->id]);
    }

    public function test_owner_can_update_team_membership()
    {
        $owner = User::factory()->owner()->create();
        $team = Team::factory()->create();
        $keep = User::factory()->create();
        $remove = User::factory()->create();
        $add = User::factory()->create();

        foreach ([$keep, $remove] as $user) {
            $teamMember = new TeamMember;
            $teamMember->team_id = $team->id;
            $teamMember->user_id = $user->id;
            $teamMember->save();
        }

        $response = $this->actingAs($owner)->patch(route('teams.update', $team), [
            'name' => $team->name,
            'description' => $team->description,
            'member_ids' => [$keep->id, $add->id],
        ]);

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseHas('team_members', ['team_id' => $team->id, 'user_id' => $keep->id]);
        $this->assertDatabaseHas('team_members', ['team_id' => $team->id, 'user_id' => $add->id]);
        $this->assertDatabaseMissing('team_members', ['team_id' => $team->id, 'user_id' => $remove->id]);
    }

    public function test_staff_cannot_view_teams()
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff)->get(route('teams.index'));

        $response->assertForbidden();
    }

    public function test_staff_cannot_create_a_team()
    {
        $staff = User::factory()->create();

        $response = $this->actingAs($staff)->post(route('teams.store'), [
            'name' => 'Structural Team',
        ]);

        $response->assertForbidden();
    }

    public function test_owner_can_delete_a_team()
    {
        $owner = User::factory()->owner()->create();
        $team = Team::factory()->create();

        $response = $this->actingAs($owner)->delete(route('teams.destroy', $team));

        $response->assertSessionHasNoErrors();
        $this->assertDatabaseMissing('teams', ['id' => $team->id]);
    }
}
