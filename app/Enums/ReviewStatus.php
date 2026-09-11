<?php

namespace App\Enums;

enum ReviewStatus: string
{
    case Pending = 'pending';
    case ChangesRequested = 'changes_requested';
    case Approved = 'approved';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'Pending Review',
            self::ChangesRequested => 'Changes Requested',
            self::Approved => 'Approved',
        };
    }
}
