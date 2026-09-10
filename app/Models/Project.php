<?php

namespace App\Models;

use App\Enums\ProjectRole;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property int $owner_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $owner
 * @property-read Collection<int, ProjectMember> $members
 * @property-read Collection<int, Folder> $folders
 * @property-read Collection<int, ProjectFile> $files
 */
#[Fillable(['name', 'description'])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    /**
     * Resolve the given user's access to this project: 'owner', a ProjectRole
     * for shared members, or null if they have no access at all.
     */
    public function roleFor(User $user): ProjectRole|string|null
    {
        if ($this->owner_id === $user->id) {
            return 'owner';
        }

        return $this->members()->where('user_id', $user->id)->first()?->role;
    }

    public function hasAccess(User $user): bool
    {
        return $this->roleFor($user) !== null;
    }

    public function isManagedBy(User $user): bool
    {
        $role = $this->roleFor($user);

        return $role === 'owner' || $role === ProjectRole::Manager;
    }

    public function isEditableBy(User $user): bool
    {
        $role = $this->roleFor($user);

        return $role === 'owner' || ($role instanceof ProjectRole && $role->canEdit());
    }

    /**
     * The user's role as a plain string ('owner', 'manager', 'editor',
     * 'viewer'), for serializing into Inertia props.
     */
    public function roleValueFor(User $user): ?string
    {
        $role = $this->roleFor($user);

        return $role instanceof ProjectRole ? $role->value : $role;
    }

    /**
     * The user's computed abilities on this project, for the frontend to
     * show/hide controls with. The server re-authorizes every mutation
     * independently - this map is UI sugar, not the source of truth.
     *
     * @return array<string, bool>
     */
    public function abilitiesFor(User $user): array
    {
        return [
            'update' => $this->isManagedBy($user),
            'delete' => $this->roleFor($user) === 'owner',
            'manageMembers' => $this->isManagedBy($user),
            'uploadFiles' => $this->isEditableBy($user),
            'createFolders' => $this->isEditableBy($user),
            'editItems' => $this->isEditableBy($user),
            'deleteItems' => $this->isManagedBy($user),
        ];
    }
}
