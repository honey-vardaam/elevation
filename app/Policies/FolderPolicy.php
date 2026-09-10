<?php

namespace App\Policies;

use App\Models\Folder;
use App\Models\Project;
use App\Models\User;

class FolderPolicy
{
    public function view(User $user, Folder $folder): bool
    {
        return $folder->project->hasAccess($user);
    }

    public function create(User $user, Project $project): bool
    {
        return $project->isEditableBy($user);
    }

    public function update(User $user, Folder $folder): bool
    {
        return $folder->project->isEditableBy($user);
    }

    public function delete(User $user, Folder $folder): bool
    {
        return $folder->project->isManagedBy($user);
    }
}
