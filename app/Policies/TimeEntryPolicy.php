<?php

namespace App\Policies;

use App\Models\TimeEntry;
use App\Models\User;

class TimeEntryPolicy
{
    public function create(User $user): bool
    {
        return true;
    }

    public function update(User $user, TimeEntry $timeEntry): bool
    {
        return $timeEntry->user_id === $user->id;
    }

    public function delete(User $user, TimeEntry $timeEntry): bool
    {
        return $timeEntry->user_id === $user->id;
    }
}
