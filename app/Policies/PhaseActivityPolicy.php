<?php

namespace App\Policies;

use App\Models\PhaseActivity;
use App\Models\ProjectPhase;
use App\Models\User;

class PhaseActivityPolicy
{
    /**
     * Any project member - viewers included - can post to a phase's
     * timeline. Extra restrictions on specific activity types (e.g. only a
     * manager may post an approval) are enforced in the request, which sees
     * the submitted type.
     */
    public function create(User $user, ProjectPhase $phase): bool
    {
        return $phase->project->hasAccess($user);
    }

    public function resolve(User $user, PhaseActivity $activity): bool
    {
        return $activity->projectPhase->project->isManagedBy($user);
    }

    /**
     * Approve or request changes on a review: the specifically tagged
     * reviewer, or a manager/owner as an override.
     */
    public function decide(User $user, PhaseActivity $activity): bool
    {
        return $activity->reviewer_id === $user->id
            || $activity->projectPhase->project->isManagedBy($user);
    }

    /**
     * Put a "changes requested" review back to pending: the original
     * submitter, or a manager/owner as an override.
     */
    public function resubmit(User $user, PhaseActivity $activity): bool
    {
        return $activity->user_id === $user->id
            || $activity->projectPhase->project->isManagedBy($user);
    }
}
