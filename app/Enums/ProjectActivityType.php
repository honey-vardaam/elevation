<?php

namespace App\Enums;

enum ProjectActivityType: string
{
    case ProjectCreated = 'project_created';
    case MemberAdded = 'member_added';
    case MemberRoleChanged = 'member_role_changed';
    case MemberRemoved = 'member_removed';
    case FileUploaded = 'file_uploaded';
    case FileUpdated = 'file_updated';
    case FileDeleted = 'file_deleted';
    case ProjectStatusChanged = 'project_status_changed';

    public function label(): string
    {
        return match ($this) {
            self::ProjectCreated => 'Project Created',
            self::MemberAdded => 'Member Added',
            self::MemberRoleChanged => 'Member Role Changed',
            self::MemberRemoved => 'Member Removed',
            self::FileUploaded => 'File Uploaded',
            self::FileUpdated => 'File Updated',
            self::FileDeleted => 'File Deleted',
            self::ProjectStatusChanged => 'Project Status Changed',
        };
    }
}
