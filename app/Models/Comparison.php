<?php

namespace App\Models;

use App\Enums\ComparisonMode;
use Database\Factories\ComparisonFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A side-by-side/overlay comparison between two files on the same project -
 * "Old vs New", "Site vs Plan", "Before vs After". Always project-scoped
 * (unlike Moodboard, there's no personal comparison concept): it's created
 * from a file inside Project Collaboration and lives alongside it.
 *
 * @property int $id
 * @property int $project_id
 * @property int $created_by
 * @property string $title
 * @property ComparisonMode $mode
 * @property int|null $left_file_id
 * @property int|null $right_file_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Project $project
 * @property-read User $creator
 * @property-read ProjectFile|null $leftFile
 * @property-read ProjectFile|null $rightFile
 * @property-read Collection<int, ComparisonAnnotation> $annotations
 * @property-read Collection<int, User> $reviewers
 */
#[Fillable(['title', 'mode'])]
class Comparison extends Model
{
    /** @use HasFactory<ComparisonFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'mode' => ComparisonMode::class,
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function leftFile(): BelongsTo
    {
        return $this->belongsTo(ProjectFile::class, 'left_file_id');
    }

    public function rightFile(): BelongsTo
    {
        return $this->belongsTo(ProjectFile::class, 'right_file_id');
    }

    public function annotations(): HasMany
    {
        return $this->hasMany(ComparisonAnnotation::class);
    }

    /**
     * Reviewers explicitly invited to this comparison - on top of whoever
     * already has access via the project - so a completed comparison can
     * be shared with any Elevation user for review, not just teammates
     * already on the project.
     */
    public function reviewers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'comparison_reviewers')
            ->withPivot('invited_by')
            ->using(ComparisonReviewer::class);
    }

    public function isComplete(): bool
    {
        return $this->left_file_id !== null && $this->right_file_id !== null;
    }

    /**
     * Whether both files can render inline (images, or a PDF alongside an
     * image/PDF) - determines if the comparison workspace can show a
     * preview at all versus falling back to a "download to compare" state.
     */
    public function isPreviewable(): bool
    {
        return $this->isRenderable($this->leftFile) && $this->isRenderable($this->rightFile);
    }

    public function isOverlayable(): bool
    {
        return $this->isImage($this->leftFile) && $this->isImage($this->rightFile);
    }

    private function isRenderable(?ProjectFile $file): bool
    {
        return $file !== null && ($this->isImage($file) || $file->mime_type === 'application/pdf');
    }

    private function isImage(?ProjectFile $file): bool
    {
        return $file !== null && str_starts_with((string) $file->mime_type, 'image/');
    }

    /**
     * @param  Builder<Comparison>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->where(function (Builder $query) use ($user) {
            $query->whereHas('project', fn (Builder $q) => $q->where(fn (Builder $access) => $access
                ->where('owner_id', $user->id)
                ->orWhereHas('members', fn (Builder $m) => $m->where('user_id', $user->id))))
                ->orWhereHas('reviewers', fn (Builder $q) => $q->where('user_id', $user->id));
        });
    }
}
