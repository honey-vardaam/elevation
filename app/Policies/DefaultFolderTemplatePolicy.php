<?php

namespace App\Policies;

use App\Models\DefaultFolderTemplate;
use App\Models\User;

class DefaultFolderTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, DefaultFolderTemplate $defaultFolderTemplate): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, DefaultFolderTemplate $defaultFolderTemplate): bool
    {
        return $user->isOwner();
    }
}
