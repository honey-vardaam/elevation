<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;

class ProjectFilePolicy
{
    public function view(User $user, ProjectFile $file): bool
    {
        return $file->project->hasAccess($user);
    }

    public function create(User $user, Project $project): bool
    {
        return $project->isEditableBy($user);
    }

    public function update(User $user, ProjectFile $file): bool
    {
        return $file->project->isEditableBy($user);
    }

    public function delete(User $user, ProjectFile $file): bool
    {
        return $file->project->isManagedBy($user);
    }
}
