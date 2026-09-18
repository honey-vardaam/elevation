<?php

namespace App\Policies;

use App\Models\Moodboard;
use App\Models\User;

class MoodboardPolicy
{
    public function view(User $user, Moodboard $moodboard): bool
    {
        return $moodboard->isPersonal()
            ? $moodboard->user_id === $user->id
            : $moodboard->project->hasAccess($user);
    }

    public function update(User $user, Moodboard $moodboard): bool
    {
        return $moodboard->isPersonal()
            ? $moodboard->user_id === $user->id
            : $moodboard->project->hasAccess($user);
    }

    public function delete(User $user, Moodboard $moodboard): bool
    {
        return $moodboard->isPersonal()
            ? $moodboard->user_id === $user->id
            : $moodboard->project->isManagedBy($user);
    }
}
