<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\User;

class ProjectPhasePolicy
{
    public function create(User $user, Project $project): bool
    {
        return $project->isManagedBy($user);
    }

    public function update(User $user, ProjectPhase $phase): bool
    {
        return $phase->project->isManagedBy($user);
    }

    public function delete(User $user, ProjectPhase $phase): bool
    {
        return $phase->project->isManagedBy($user);
    }

    public function advance(User $user, ProjectPhase $phase): bool
    {
        return $phase->project->isManagedBy($user);
    }
}
