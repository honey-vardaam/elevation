<?php

namespace App\Http\Controllers\Projects;

use App\Enums\ProjectActivityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Members\StoreMemberRequest;
use App\Http\Requests\Members\UpdateMemberRequest;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProjectMemberController extends Controller
{
    public function store(StoreMemberRequest $request, Project $project): RedirectResponse
    {
        $user = User::where('email', $request->validated('email'))->firstOrFail();

        $member = new ProjectMember(['role' => $request->validated('role')]);
        $member->project_id = $project->id;
        $member->user_id = $user->id;
        $member->save();

        ProjectActivity::log($project, ProjectActivityType::MemberAdded, $request->user(), meta: [
            'name' => $user->name,
            'role' => $member->role->value,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member added.')]);

        return back();
    }

    public function update(UpdateMemberRequest $request, Project $project, ProjectMember $member): RedirectResponse
    {
        abort_unless($member->project_id === $project->id, 404);

        $previousRole = $member->role;
        $member->role = $request->validated('role');
        $member->save();

        if ($member->role !== $previousRole) {
            ProjectActivity::log($project, ProjectActivityType::MemberRoleChanged, $request->user(), meta: [
                'name' => $member->user->name,
                'from' => $previousRole->value,
                'to' => $member->role->value,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member role updated.')]);

        return back();
    }

    public function destroy(Request $request, Project $project, ProjectMember $member): RedirectResponse
    {
        abort_unless($member->project_id === $project->id, 404);
        Gate::authorize('manageMembers', $project);

        $name = $member->user->name;
        $role = $member->role->value;

        $member->delete();

        ProjectActivity::log($project, ProjectActivityType::MemberRemoved, $request->user(), meta: [
            'name' => $name,
            'role' => $role,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Member removed.')]);

        return back();
    }
}
