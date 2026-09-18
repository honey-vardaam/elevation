<?php

namespace App\Support;

use App\Enums\ProjectActivityType;
use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectPhase;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

/**
 * Normalizes App\Models\ProjectActivity (project-wide events: membership,
 * files, status) and App\Models\PhaseActivity (comments/change-requests/
 * phase status - see PhaseActivityPresenter) rows into one shape, for the
 * project's unified Activity Timeline.
 */
class ProjectActivityPresenter
{
    /**
     * @return array<string, mixed>
     */
    public static function fromProjectActivity(ProjectActivity $activity): array
    {
        return [
            'id' => 'project-'.$activity->id,
            'kind' => 'project',
            'type' => $activity->type->value,
            'summary' => self::summarize($activity),
            'actor' => $activity->causer ? ['id' => $activity->causer->id, 'name' => $activity->causer->name] : null,
            'created_at' => $activity->created_at->toIso8601String(),
            'action' => self::actionFor($activity),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public static function fromPhaseActivity(PhaseActivity $activity, ProjectPhase $phase, bool $isCurrentPhase): array
    {
        return [
            'id' => 'phase-'.$activity->id,
            'kind' => 'phase',
            'type' => $activity->type->value,
            'summary' => PhaseActivityPresenter::preview($activity),
            'actor' => ['id' => $activity->author->id, 'name' => $activity->author->name],
            'created_at' => $activity->created_at->toIso8601String(),
            'action' => [
                'type' => $isCurrentPhase ? 'scroll_to_chat' : 'open_phase_dialog',
                'phase_id' => $phase->id,
            ],
        ];
    }

    /**
     * The project's project_activities and phase_activities (top-level
     * entries only - replies stay nested inside the phase dialog/chat)
     * merged into one chronological, paginated feed.
     */
    public static function feed(Project $project, int $perPage = 25, int $page = 1): LengthAwarePaginator
    {
        $projectRows = ProjectActivity::where('project_id', $project->id)
            ->with(['causer:id,name', 'subject'])
            ->get()
            ->map(fn (ProjectActivity $activity) => self::fromProjectActivity($activity));

        $currentPhase = $project->currentPhase();
        $phases = $project->phases()->get()->keyBy('id');

        $phaseRows = PhaseActivity::whereIn('project_phase_id', $phases->keys())
            ->whereNull('parent_id')
            ->with('author:id,name')
            ->get()
            ->map(function (PhaseActivity $activity) use ($phases, $currentPhase) {
                $phase = $phases->get($activity->project_phase_id);

                return self::fromPhaseActivity($activity, $phase, $currentPhase?->id === $phase->id);
            });

        $merged = $projectRows->concat($phaseRows)->sortByDesc('created_at')->values();

        $items = $merged->forPage($page, $perPage)->values();

        return new LengthAwarePaginator(
            $items,
            $merged->count(),
            $perPage,
            $page,
            ['path' => request()->url(), 'query' => request()->query()],
        );
    }

    private static function summarize(ProjectActivity $activity): string
    {
        $meta = $activity->meta ?? [];

        return match ($activity->type) {
            ProjectActivityType::ProjectCreated => 'Created the project',
            ProjectActivityType::MemberAdded => ($meta['name'] ?? 'Someone').' joined as '.($meta['role'] ?? 'a member'),
            ProjectActivityType::MemberRoleChanged => ($meta['name'] ?? 'A member').'\'s role changed from '.($meta['from'] ?? '?').' to '.($meta['to'] ?? '?'),
            ProjectActivityType::MemberRemoved => ($meta['name'] ?? 'A member').' was removed from the project',
            ProjectActivityType::FileUploaded => 'Uploaded '.($meta['name'] ?? 'a file'),
            ProjectActivityType::FileUpdated => self::summarizeFileUpdate($meta),
            ProjectActivityType::FileDeleted => 'Deleted '.($meta['name'] ?? 'a file'),
            ProjectActivityType::ProjectStatusChanged => 'Changed project status from '.($meta['from'] ?? '?').' to '.($meta['to'] ?? '?'),
        };
    }

    /**
     * @param  array<string, mixed>  $meta
     */
    private static function summarizeFileUpdate(array $meta): string
    {
        $renamed = $meta['renamed'] ?? false;
        $moved = $meta['moved'] ?? false;
        $name = $meta['new_name'] ?? $meta['old_name'] ?? 'a file';

        if ($renamed && $moved) {
            return "Renamed and moved {$meta['old_name']} to {$name}";
        }

        if ($renamed) {
            return "Renamed {$meta['old_name']} to {$name}";
        }

        if ($moved) {
            return "Moved {$name} to another folder";
        }

        return "Updated {$name}";
    }

    /**
     * @return array<string, mixed>|null
     */
    private static function actionFor(ProjectActivity $activity): ?array
    {
        $isFileEvent = in_array($activity->type, [
            ProjectActivityType::FileUploaded,
            ProjectActivityType::FileUpdated,
        ], true);

        if ($isFileEvent && $activity->subject !== null) {
            return ['type' => 'open_folder', 'folder_id' => $activity->subject->folder_id];
        }

        return null;
    }
}
