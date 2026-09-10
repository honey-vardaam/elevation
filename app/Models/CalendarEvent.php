<?php

namespace App\Models;

use Database\Factories\CalendarEventFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $user_id
 * @property int|null $project_id
 * @property string $title
 * @property string|null $description
 * @property Carbon $start_at
 * @property Carbon|null $end_at
 * @property bool $all_day
 * @property int|null $remind_minutes_before
 * @property Carbon|null $reminded_at
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Project|null $project
 */
#[Fillable([
    'title',
    'description',
    'start_at',
    'end_at',
    'all_day',
    'remind_minutes_before',
])]
class CalendarEvent extends Model
{
    /** @use HasFactory<CalendarEventFactory> */
    use HasFactory;

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_at' => 'datetime',
            'end_at' => 'datetime',
            'all_day' => 'boolean',
            'reminded_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    /**
     * Whether this event's reminder is due right now and hasn't already
     * been shown to the user.
     */
    public function isReminderDue(): bool
    {
        if ($this->remind_minutes_before === null || $this->reminded_at !== null) {
            return false;
        }

        return $this->start_at->copy()->subMinutes($this->remind_minutes_before)->lte(now());
    }
}
