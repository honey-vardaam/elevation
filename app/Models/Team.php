<?php

namespace App\Models;

use Database\Factories\TeamFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read \Illuminate\Database\Eloquent\Collection<int, TeamMember> $members
 */
#[Fillable(['name', 'description'])]
class Team extends Model
{
    /** @use HasFactory<TeamFactory> */
    use HasFactory;

    public function members(): HasMany
    {
        return $this->hasMany(TeamMember::class);
    }

    /**
     * All teams with their members, shaped for the frontend.
     *
     * @return Collection<int, array<string, mixed>>
     */
    public static function summaries(): Collection
    {
        return self::query()
            ->with('members.user:id,name,email')
            ->orderBy('name')
            ->get()
            ->map(fn (self $team) => [
                'id' => $team->id,
                'name' => $team->name,
                'description' => $team->description,
                'members' => $team->members->map(fn (TeamMember $member) => [
                    'id' => $member->user->id,
                    'name' => $member->user->name,
                    'email' => $member->user->email,
                ])->values(),
            ]);
    }
}
