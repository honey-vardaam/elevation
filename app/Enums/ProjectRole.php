<?php

namespace App\Enums;

enum ProjectRole: string
{
    case Manager = 'manager';
    case Editor = 'editor';
    case Viewer = 'viewer';

    /**
     * Whether this role can delete files/folders and manage project members.
     */
    public function isManager(): bool
    {
        return $this === self::Manager;
    }

    /**
     * Whether this role can upload files, create folders, and rename/move items.
     */
    public function canEdit(): bool
    {
        return $this === self::Manager || $this === self::Editor;
    }
}
