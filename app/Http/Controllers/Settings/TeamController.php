<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Teams\StoreTeamRequest;
use App\Http\Requests\Teams\UpdateTeamRequest;
use App\Models\Team;
use App\Models\TeamMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class TeamController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Team::class);

        return Inertia::render('settings/teams', [
            'teams' => Team::summaries(),
            'assignableUsers' => User::query()->orderBy('name')->get(['id', 'name', 'email']),
        ]);
    }

    public function store(StoreTeamRequest $request): RedirectResponse
    {
        $team = new Team($request->safe()->except('member_ids'));
        $team->save();

        $this->syncMembers($team, $request->validated('member_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team created.')]);

        return to_route('teams.index');
    }

    public function update(UpdateTeamRequest $request, Team $team): RedirectResponse
    {
        $team->update($request->safe()->except('member_ids'));

        $this->syncMembers($team, $request->validated('member_ids', []));

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team updated.')]);

        return to_route('teams.index');
    }

    public function destroy(Request $request, Team $team): RedirectResponse
    {
        Gate::authorize('delete', $team);

        $team->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Team removed.')]);

        return to_route('teams.index');
    }

    /**
     * @param  array<int, int>  $userIds
     */
    private function syncMembers(Team $team, array $userIds): void
    {
        $team->members()->whereNotIn('user_id', $userIds)->delete();

        $existingUserIds = $team->members()->pluck('user_id');

        foreach ($userIds as $userId) {
            if ($existingUserIds->contains($userId)) {
                continue;
            }

            $teamMember = new TeamMember;
            $teamMember->team_id = $team->id;
            $teamMember->user_id = $userId;
            $teamMember->save();
        }
    }
}
