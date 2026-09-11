<?php

namespace App\Support;

use App\Enums\PhaseActivityType;
use App\Enums\ProjectPhaseStatus;
use App\Models\PhaseActivity;
use App\Models\Project;
use Illuminate\Support\Str;

class PhaseActivityPresenter
{
    /**
     * Serialize a phase timeline entry (and its replies) into the shape
     * both the project page's collaboration panel and the Inbox expect.
     *
     * @return array<string, mixed>
     */
    public static function toArray(PhaseActivity $activity, Project $project): array
    {
        return [
            'id' => $activity->id,
            'type' => $activity->type->value,
            'body' => $activity->body,
            'meta' => $activity->meta,
            'resolved_at' => $activity->resolved_at?->toIso8601String(),
            'resolved_by' => $activity->resolvedBy ? ['id' => $activity->resolvedBy->id, 'name' => $activity->resolvedBy->name] : null,
            'reviewer' => $activity->reviewer ? ['id' => $activity->reviewer->id, 'name' => $activity->reviewer->name] : null,
            'review_status' => $activity->review_status?->value,
            'author' => ['id' => $activity->author->id, 'name' => $activity->author->name],
            'attachment' => $activity->attachment ? [
                'id' => $activity->attachment->id,
                'name' => $activity->attachment->name,
                'size' => $activity->attachment->size,
                'download_url' => route('projects.files.download', [$project, $activity->attachment]),
            ] : null,
            'created_at' => $activity->created_at->toIso8601String(),
            'replies' => $activity->replies->map(fn (PhaseActivity $reply) => self::toArray($reply, $project))->all(),
        ];
    }

    /**
     * A one-line human-readable summary of an activity, for feeds/previews
     * (the Inbox conversation list, the dashboard's recent-activity feed).
     */
    public static function preview(PhaseActivity $activity): string
    {
        return match ($activity->type) {
            PhaseActivityType::Comment, PhaseActivityType::ChangeRequest => Str::limit((string) $activity->body, 80),
            PhaseActivityType::Review => 'Requested review from '.($activity->reviewer->name ?? 'someone').': '.Str::limit((string) $activity->body, 60),
            PhaseActivityType::StatusChanged => 'Changed status to '.ProjectPhaseStatus::from($activity->meta['to'] ?? '')->label(),
            PhaseActivityType::Approved => 'Approved this phase',
            PhaseActivityType::ProjectCompleted => 'Marked the project Completed',
        };
    }
}
