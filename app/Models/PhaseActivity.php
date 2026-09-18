<?php

namespace App\Models;

use App\Enums\ActivityStatus;
use App\Enums\PhaseActivityType;
use Database\Factories\PhaseActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $project_phase_id
 * @property int $user_id
 * @property PhaseActivityType $type
 * @property int|null $parent_id
 * @property string|null $body
 * @property array<string, mixed>|null $meta
 * @property int|null $attachment_id
 * @property int|null $reviewer_id
 * @property ActivityStatus|null $activity_status
 * @property Carbon|null $resolved_at
 * @property int|null $resolved_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read ProjectPhase $projectPhase
 * @property-read User $author
 * @property-read PhaseActivity|null $parent
 * @property-read Collection<int, PhaseActivity> $replies
 * @property-read ProjectFile|null $attachment
 * @property-read User|null $resolvedBy
 * @property-read User|null $reviewer
 */
#[Fillable(['type', 'body', 'parent_id', 'meta', 'reviewer_id', 'activity_status'])]
class PhaseActivity extends Model
{
    /** @use HasFactory<PhaseActivityFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'type' => PhaseActivityType::class,
            'meta' => 'array',
            'activity_status' => ActivityStatus::class,
            'resolved_at' => 'datetime',
        ];
    }

    public function projectPhase(): BelongsTo
    {
        return $this->belongsTo(ProjectPhase::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id')->orderBy('created_at');
    }

    public function attachment(): BelongsTo
    {
        return $this->belongsTo(ProjectFile::class, 'attachment_id');
    }

    public function resolvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
