<?php

namespace App\Models;

use App\Enums\MoodboardElementType;
use Database\Factories\MoodboardFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * A freeform moodboard canvas. Personal when project_id is null (visible
 * only to its creator); otherwise a project moodboard - for architects to
 * pin material references, color palettes, and design notes for a project -
 * visible to every project member and editable by the project's owner and
 * managers.
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $project_id
 * @property string $title
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $user
 * @property-read Project|null $project
 * @property-read Collection<int, MoodboardElement> $elements
 */
#[Fillable(['title', 'project_id'])]
class Moodboard extends Model
{
    /** @use HasFactory<MoodboardFactory> */
    use HasFactory;

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(Project::class);
    }

    public function elements(): HasMany
    {
        return $this->hasMany(MoodboardElement::class);
    }

    public function isPersonal(): bool
    {
        return $this->project_id === null;
    }

    /**
     * Personal moodboards the user created, plus moodboards on any project
     * they own or belong to.
     *
     * @param  Builder<Moodboard>  $query
     */
    public function scopeVisibleTo(Builder $query, User $user): void
    {
        $query->where(function (Builder $query) use ($user) {
            $query->where(fn (Builder $q) => $q->whereNull('project_id')->where('user_id', $user->id))
                ->orWhereHas('project', fn (Builder $q) => $q->where(fn (Builder $access) => $access
                    ->where('owner_id', $user->id)
                    ->orWhereHas('members', fn (Builder $m) => $m->where('user_id', $user->id))));
        });
    }

    /**
     * @return array{total: int, done: int}
     */
    public function itemCounts(): array
    {
        $total = 0;
        $done = 0;

        foreach ($this->elements as $element) {
            if ($element->type !== MoodboardElementType::Checklist) {
                continue;
            }

            foreach ($element->data['items'] ?? [] as $item) {
                $total++;
                $done += ! empty($item['done']) ? 1 : 0;
            }
        }

        return ['total' => $total, 'done' => $done];
    }
}
