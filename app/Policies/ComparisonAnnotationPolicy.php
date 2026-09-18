<?php

namespace App\Policies;

use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use App\Models\User;

class ComparisonAnnotationPolicy
{
    /**
     * Anyone with view access to the comparison - project members and
     * invited reviewers alike - can leave a comment or pin.
     */
    public function create(User $user, Comparison $comparison): bool
    {
        return (new ComparisonPolicy)->view($user, $comparison);
    }

    /**
     * Only the author may delete their own comment - no manager override,
     * matching phase comments.
     */
    public function delete(User $user, ComparisonAnnotation $annotation): bool
    {
        return $annotation->user_id === $user->id;
    }

    /**
     * Mark a pin/thread resolved (or reopen it): the author, or whoever can
     * manage the comparison.
     */
    public function resolve(User $user, ComparisonAnnotation $annotation): bool
    {
        return $annotation->user_id === $user->id
            || (new ComparisonPolicy)->update($user, $annotation->comparison);
    }
}
