<?php

namespace App\Enums;

enum PhaseActivityType: string
{
    case Comment = 'comment';
    case ChangeRequest = 'change_request';
    case StatusChanged = 'status_changed';
    case Approved = 'approved';
    case ProjectCompleted = 'project_completed';

    public function label(): string
    {
        return match ($this) {
            self::Comment => 'Comment',
            self::ChangeRequest => 'Request',
            self::StatusChanged => 'Status Changed',
            self::Approved => 'Approved',
            self::ProjectCompleted => 'Project Completed',
        };
    }

    /**
     * Whether this activity is a system-generated timeline event (rendered
     * as a centered muted line) rather than an authored comment bubble.
     */
    public function isSystemGenerated(): bool
    {
        return match ($this) {
            self::StatusChanged, self::Approved, self::ProjectCompleted => true,
            self::Comment, self::ChangeRequest => false,
        };
    }
}
