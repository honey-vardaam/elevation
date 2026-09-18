<?php

namespace App\Models;

use App\Enums\ProjectActivityType;
use Database\Factories\ProjectActivityFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Carbon;

/**
 * A project-wide audit-log entry - project creation, membership, and file
 * events that (unlike App\Models\PhaseActivity) aren't scoped to a single
 * phase. Logged by hand from inside each relevant controller action, same
 * convention PhaseActivity's system-generated rows already use - there's
 * no model-observer/event infrastructure in this codebase.
 *
 * @property int $id
 * @property int $project_id
 * @property int|null $causer_id
 * @property ProjectActivityType $type
 * @property string|null $subject_type
 * @property int|null $subject_id
 * @property array|null $meta
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Project $project
 * @property-read User|null $causer
 * @property-read Model|null $subject
 */
#[Fillable(['type', 'meta'])]
class ProjectActivity extends Model
{
    /** @use HasFactory<ProjectActivityFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'type' => ProjectActivityType::class,
            'meta' => 'array',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function causer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'causer_id');
    }

    public function subject(): MorphTo
    {
        return $this->morphTo();
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    public static function log(
        Project $project,
        ProjectActivityType $type,
        User $causer,
        ?Model $subject = null,
        array $meta = [],
    ): self {
        $activity = new self(['type' => $type, 'meta' => $meta]);
        $activity->project_id = $project->id;
        $activity->causer_id = $causer->id;

        if ($subject !== null) {
            $activity->subject()->associate($subject);
        }

        $activity->save();

        return $activity;
    }
}
