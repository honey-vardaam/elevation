<?php

namespace App\Enums;

enum UserRole: string
{
    case Owner = 'owner';
    case Staff = 'staff';

    public function isOwner(): bool
    {
        return $this === self::Owner;
    }
}
