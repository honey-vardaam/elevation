<?php

namespace App\Policies;

use App\Models\Comparison;
use App\Models\User;

class ComparisonPolicy
{
    /**
     * View + comment access: anyone with project access, or anyone
     * explicitly invited as a reviewer (which is how a completed
     * comparison gets shared with an Elevation user outside the project).
     */
    public function view(User $user, Comparison $comparison): bool
    {
        return $comparison->project->hasAccess($user)
            || $comparison->reviewers->contains('id', $user->id);
    }

    public function update(User $user, Comparison $comparison): bool
    {
        return $comparison->created_by === $user->id || $comparison->project->isManagedBy($user);
    }

    public function delete(User $user, Comparison $comparison): bool
    {
        return $this->update($user, $comparison);
    }

    public function manageReviewers(User $user, Comparison $comparison): bool
    {
        return $this->update($user, $comparison);
    }
}
