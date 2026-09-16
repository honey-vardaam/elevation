<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;

class TeamPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Team $team): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, Team $team): bool
    {
        return $user->isOwner();
    }
}
