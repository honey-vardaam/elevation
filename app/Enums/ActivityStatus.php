<?php

namespace App\Enums;

enum ActivityStatus: string
{
    case Open = 'open';
    case ChangesRequested = 'changes_requested';
    case Resolved = 'resolved';

    public function label(): string
    {
        return match ($this) {
            self::Open => 'Open',
            self::ChangesRequested => 'Changes Requested',
            self::Resolved => 'Resolved',
        };
    }
}
