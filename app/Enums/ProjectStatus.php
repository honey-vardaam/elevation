<?php

namespace App\Enums;

enum ProjectStatus: string
{
    case Ongoing = 'ongoing';
    case OnHold = 'on_hold';
    case Completed = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Ongoing => 'Ongoing',
            self::OnHold => 'On Hold',
            self::Completed => 'Completed',
        };
    }
}
