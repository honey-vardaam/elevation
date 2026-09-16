<?php

namespace App\Models;

use App\Enums\PhaseActivityType;
use App\Enums\ProjectPhaseStatus;
use Database\Factories\ProjectPhaseFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $project_id
 * @property int|null $phase_template_id
 * @property int|null $team_id
 * @property string $name
 * @property int $sort_order
 * @property ProjectPhaseStatus $status
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property string|null $notes
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Project $project
 * @property-read PhaseTemplate|null $phaseTemplate
 * @property-read Team|null $team
 * @property-read Collection<int, PhaseActivity> $activities
 */
#[Fillable(['name', 'status', 'start_date', 'end_date', 'notes', 'team_id'])]
class ProjectPhase extends Model
{
    /** @use HasFactory<ProjectPhaseFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'status' => ProjectPhaseStatus::class,
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function phaseTemplate(): BelongsTo
    {
        return $this->belongsTo(PhaseTemplate::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * Top-level timeline entries for this phase, oldest first. Replies are
     * loaded through each entry's own `replies` relation, not flattened
     * into this list.
     */
    public function activities(): HasMany
    {
        return $this->hasMany(PhaseActivity::class)
            ->whereNull('parent_id')
            ->orderBy('created_at');
    }

    public function openChangeRequestsCount(): int
    {
        return $this->activities()
            ->where('type', PhaseActivityType::ChangeRequest)
            ->whereNull('resolved_at')
            ->count();
    }

    /**
     * Total comments left on this phase, replies included.
     */
    public function commentsCount(): int
    {
        return PhaseActivity::where('project_phase_id', $this->id)
            ->where('type', PhaseActivityType::Comment)
            ->count();
    }

    /**
     * Total change requests ever raised on this phase (open and resolved).
     */
    public function changeRequestsCount(): int
    {
        return PhaseActivity::where('project_phase_id', $this->id)
            ->where('type', PhaseActivityType::ChangeRequest)
            ->count();
    }

    /**
     * The single most recent timeline entry, replies included (unlike
     * `activities()`) - used for the Inbox's "last message" preview.
     */
    public function latestActivity(): ?PhaseActivity
    {
        return PhaseActivity::where('project_phase_id', $this->id)->latest()->first();
    }

    /**
     * The most recent timeline entries, replies included - a lightweight
     * feed for the phase accordion's "Recent activity" preview.
     *
     * @return Collection<int, PhaseActivity>
     */
    public function recentActivity(int $limit = 3): Collection
    {
        return PhaseActivity::where('project_phase_id', $this->id)
            ->with(['author:id,name', 'attachment:id,name'])
            ->latest()
            ->limit($limit)
            ->get();
    }

    /**
     * A human-readable span for the phase's date range, e.g. "3 weeks" or
     * "5 days" - null when either end of the range is unset.
     */
    public function durationLabel(): ?string
    {
        if ($this->start_date === null || $this->end_date === null) {
            return null;
        }

        $days = (int) $this->start_date->diffInDays($this->end_date) + 1;

        if ($days >= 14) {
            $weeks = intdiv($days, 7);

            return $weeks.' '.Str::plural('week', $weeks);
        }

        return $days.' '.Str::plural('day', $days);
    }
}
