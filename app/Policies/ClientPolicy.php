<?php

namespace App\Policies;

use App\Models\Client;
use App\Models\User;

class ClientPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, Client $client): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, Client $client): bool
    {
        return $user->isOwner();
    }
}
