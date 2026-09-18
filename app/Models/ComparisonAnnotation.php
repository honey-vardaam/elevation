<?php

namespace App\Models;

use App\Enums\ComparisonAnnotationSide;
use Database\Factories\ComparisonAnnotationFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A comment on a comparison - either pinned to a point on one side (`side`
 * left/right with `x`/`y` as a percentage of that file's rendered size, so
 * the pin stays put across zoom/pan) or a general, unpinned discussion
 * comment (`side` general, `x`/`y` null).
 *
 * @property int $id
 * @property int $comparison_id
 * @property int $user_id
 * @property int|null $parent_id
 * @property ComparisonAnnotationSide $side
 * @property float|null $x
 * @property float|null $y
 * @property string $body
 * @property Carbon|null $resolved_at
 * @property int|null $resolved_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Comparison $comparison
 * @property-read User $author
 * @property-read ComparisonAnnotation|null $parent
 * @property-read Collection<int, ComparisonAnnotation> $replies
 * @property-read User|null $resolvedByUser
 */
#[Fillable(['side', 'x', 'y', 'body', 'parent_id'])]
class ComparisonAnnotation extends Model
{
    /** @use HasFactory<ComparisonAnnotationFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'side' => ComparisonAnnotationSide::class,
            'x' => 'float',
            'y' => 'float',
            'resolved_at' => 'datetime',
        ];
    }

    public function comparison(): BelongsTo
    {
        return $this->belongsTo(Comparison::class);
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
        return $this->hasMany(self::class, 'parent_id');
    }

    public function resolvedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'resolved_by');
    }

    public function isPinned(): bool
    {
        return $this->side !== ComparisonAnnotationSide::General;
    }
}
