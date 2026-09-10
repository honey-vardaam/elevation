<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Project $project): bool
    {
        return $project->hasAccess($user);
    }

    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, Project $project): bool
    {
        return $project->isManagedBy($user);
    }

    public function delete(User $user, Project $project): bool
    {
        return $project->roleFor($user) === 'owner';
    }

    public function manageMembers(User $user, Project $project): bool
    {
        return $project->isManagedBy($user);
    }
}
