<?php

namespace App\Policies;

use App\Models\Portfolio;
use App\Models\User;

class PortfolioPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Portfolio $portfolio): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, Portfolio $portfolio): bool
    {
        return $user->isOwner();
    }
}
