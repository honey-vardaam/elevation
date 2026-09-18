<?php

namespace App\Policies;

use App\Models\PhaseFlowTemplate;
use App\Models\User;

class PhaseFlowTemplatePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isOwner();
    }

    public function create(User $user): bool
    {
        return $user->isOwner();
    }

    public function update(User $user, PhaseFlowTemplate $phaseFlowTemplate): bool
    {
        return $user->isOwner();
    }

    public function delete(User $user, PhaseFlowTemplate $phaseFlowTemplate): bool
    {
        return $user->isOwner();
    }
}
