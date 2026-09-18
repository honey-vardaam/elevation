<?php

namespace App\Http\Controllers;

use App\Enums\ActivityStatus;
use App\Enums\PhaseActivityType;
use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Support\PhaseActivityPresenter;
use App\Support\ProjectFilePresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InboxController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $accessibleProjects = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->pluck('id');

        $phases = ProjectPhase::query()
            ->whereIn('project_id', $accessibleProjects)
            ->whereHas('activities')
            ->with('project:id,name,owner_id')
            ->get();

        $conversations = $phases
            ->map(function (ProjectPhase $phase) use ($user) {
                $latest = $phase->latestActivity();
                $latest?->loadMissing('author:id,name', 'reviewer:id,name');

                $pendingReviewForMe = PhaseActivity::where('project_phase_id', $phase->id)
                    ->where('type', PhaseActivityType::ChangeRequest)
                    ->where('activity_status', ActivityStatus::Open)
                    ->where('reviewer_id', $user->id)
                    ->exists();

                return [
                    'phase_id' => $phase->id,
                    'phase_name' => $phase->name,
                    'phase_status' => $phase->status->value,
                    'project' => ['id' => $phase->project->id, 'name' => $phase->project->name],
                    'open_change_requests_count' => $phase->openChangeRequestsCount(),
                    'pending_review_for_me' => $pendingReviewForMe,
                    'last_activity' => $latest ? [
                        'author_name' => $latest->author->name,
                        'preview' => PhaseActivityPresenter::preview($latest),
                        'created_at' => $latest->created_at->toIso8601String(),
                    ] : null,
                    'sort_key' => $latest?->created_at,
                ];
            })
            ->sortByDesc('sort_key')
            ->values()
            ->map(fn (array $conversation) => collect($conversation)->except('sort_key')->all());

        $activePhaseId = $request->query('phase') ? (int) $request->query('phase') : null;
        $activePhase = $activePhaseId !== null
            ? $phases->firstWhere('id', $activePhaseId)
            : null;

        $activities = $activePhase !== null
            ? $activePhase->activities()
                ->with(['author:id,name', 'reviewer:id,name', 'replies.author:id,name', 'attachment:id,name,size,mime_type', 'resolvedBy:id,name'])
                ->get()
                ->map(fn (PhaseActivity $activity) => PhaseActivityPresenter::toArray($activity, $activePhase->project))
            : [];

        $nextPhaseName = null;
        $taggableMembers = [];
        $projectFiles = [];

        if ($activePhase !== null) {
            $nextPhaseName = $activePhase->project->phases()
                ->where('sort_order', '>', $activePhase->sort_order)
                ->orderBy('sort_order')
                ->value('name');

            $taggableMembers = $this->taggableMembers($activePhase->project);
            $projectFiles = ProjectFilePresenter::forProject($activePhase->project);
        }

        return Inertia::render('inbox', [
            'conversations' => $conversations,
            'activePhaseId' => $activePhase?->id,
            'activePhase' => $activePhase ? [
                'id' => $activePhase->id,
                'name' => $activePhase->name,
                'status' => $activePhase->status->value,
                'project' => ['id' => $activePhase->project->id, 'name' => $activePhase->project->name],
                'open_change_requests_count' => $activePhase->openChangeRequestsCount(),
            ] : null,
            'activities' => $activities,
            'canManage' => $activePhase !== null && $activePhase->project->isManagedBy($user),
            'nextPhaseName' => $nextPhaseName,
            'taggableMembers' => $taggableMembers,
            'projectFiles' => $projectFiles,
        ]);
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function taggableMembers(Project $project): array
    {
        $members = collect([['id' => $project->owner->id, 'name' => $project->owner->name]]);

        $members = $members->merge(
            $project->members()
                ->with('user:id,name')
                ->get()
                ->map(fn ($member) => ['id' => $member->user->id, 'name' => $member->user->name])
        );

        return $members->unique('id')->values()->all();
    }
}
