<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, User $target): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, User $target): bool
    {
        if (! $user->isOwner()) {
            return false;
        }

        // Can't delete your own account here - that stays on the
        // Settings page's self-service flow.
        if ($target->id === $user->id) {
            return false;
        }

        // Deleting a project owner would cascade-delete every project
        // they own - block until those projects are reassigned/deleted.
        if ($target->ownedProjects()->exists()) {
            return false;
        }

        // Never allow deleting the last remaining Owner - that would
        // lock everyone out of user management and project creation.
        if ($target->role === UserRole::Owner && User::where('role', UserRole::Owner)->count() <= 1) {
            return false;
        }

        return true;
    }
}
