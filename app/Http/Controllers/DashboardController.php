<?php

namespace App\Http\Controllers;

use App\Enums\PhaseActivityType;
use App\Enums\ProjectPhaseStatus;
use App\Enums\ProjectStatus;
use App\Models\CalendarEvent;
use App\Models\Client;
use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use App\Support\PhaseActivityPresenter;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $accessibleProjectIds = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->pluck('id');

        $statusCounts = [
            'ongoing' => Project::whereIn('id', $accessibleProjectIds)->where('status', ProjectStatus::Ongoing)->count(),
            'on_hold' => Project::whereIn('id', $accessibleProjectIds)->where('status', ProjectStatus::OnHold)->count(),
            'completed' => Project::whereIn('id', $accessibleProjectIds)->where('status', ProjectStatus::Completed)->count(),
        ];

        $accessiblePhaseIds = ProjectPhase::whereIn('project_id', $accessibleProjectIds)->pluck('id');

        $openChangeRequestsTotal = PhaseActivity::whereIn('project_phase_id', $accessiblePhaseIds)
            ->where('type', PhaseActivityType::ChangeRequest)
            ->whereNull('resolved_at')
            ->count();

        $needsAttention = ProjectPhase::whereIn('id', $accessiblePhaseIds)
            ->where('status', ProjectPhaseStatus::InProgress)
            ->with('project:id,name')
            ->get()
            ->map(fn (ProjectPhase $phase) => [
                'phase_id' => $phase->id,
                'phase_name' => $phase->name,
                'project' => ['id' => $phase->project->id, 'name' => $phase->project->name],
                'open_change_requests_count' => $phase->openChangeRequestsCount(),
            ])
            ->filter(fn (array $row) => $row['open_change_requests_count'] > 0)
            ->sortByDesc('open_change_requests_count')
            ->take(5)
            ->values();

        $recentActivity = PhaseActivity::whereIn('project_phase_id', $accessiblePhaseIds)
            ->with(['author:id,name', 'projectPhase:id,name,project_id', 'projectPhase.project:id,name'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (PhaseActivity $activity) => [
                'id' => $activity->id,
                'author_name' => $activity->author->name,
                'preview' => PhaseActivityPresenter::preview($activity),
                'project' => ['id' => $activity->projectPhase->project->id, 'name' => $activity->projectPhase->project->name],
                'phase' => ['id' => $activity->projectPhase->id, 'name' => $activity->projectPhase->name],
                'created_at' => $activity->created_at->toIso8601String(),
            ]);

        $reminders = CalendarEvent::query()
            ->where('user_id', $user->id)
            ->where('start_at', '>=', now())
            ->orderBy('start_at')
            ->with('project:id,name')
            ->limit(5)
            ->get()
            ->map(fn (CalendarEvent $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'start_at' => $event->start_at->toIso8601String(),
                'all_day' => $event->all_day,
                'project' => $event->project ? ['id' => $event->project->id, 'name' => $event->project->name] : null,
            ]);

        $activeTimeEntry = TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereNull('ended_at')
            ->with('project:id,name')
            ->latest('started_at')
            ->first();

        $hoursTrackedToday = round(TimeEntry::query()
            ->where('user_id', $user->id)
            ->whereDate('started_at', today())
            ->get()
            ->sum(fn (TimeEntry $entry) => $entry->durationInSeconds()) / 3600, 1);

        $tasks = Task::query()
            ->where('user_id', $user->id)
            ->where(fn ($query) => $query->where('is_completed', false)->orWhere('completed_at', '>=', now()->subDay()))
            ->orderBy('is_completed')
            ->orderBy('created_at')
            ->get()
            ->map(fn (Task $task) => [
                'id' => $task->id,
                'title' => $task->title,
                'is_completed' => $task->is_completed,
                'project' => $task->project ? ['id' => $task->project->id, 'name' => $task->project->name] : null,
            ]);

        $allottedProjects = Project::whereIn('id', $accessibleProjectIds)
            ->with(['owner:id,name', 'members.user:id,name'])
            ->latest()
            ->limit(6)
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'status' => $project->status->value,
                'members' => collect([$project->owner])
                    ->merge($project->members->pluck('user'))
                    ->unique('id')
                    ->take(4)
                    ->map(fn (User $member) => ['id' => $member->id, 'name' => $member->name])
                    ->values(),
            ]);

        $weeklyActivity = collect(range(6, 0))->map(function (int $daysAgo) use ($user, $accessiblePhaseIds) {
            $day = today()->subDays($daysAgo);

            $hours = round(TimeEntry::query()
                ->where('user_id', $user->id)
                ->whereDate('started_at', $day)
                ->get()
                ->sum(fn (TimeEntry $entry) => $entry->durationInSeconds()) / 3600, 1);

            $tasksCompleted = Task::query()
                ->where('user_id', $user->id)
                ->whereDate('completed_at', $day)
                ->count();

            $workItems = PhaseActivity::whereIn('project_phase_id', $accessiblePhaseIds)
                ->whereDate('created_at', $day)
                ->count();

            return [
                'date' => $day->toDateString(),
                'label' => $day->format('D'),
                'hours' => $hours,
                'tasks_completed' => $tasksCompleted,
                'work_items' => $workItems,
            ];
        })->values();

        $totalPhases = ProjectPhase::whereIn('id', $accessiblePhaseIds)->count();
        $completedPhases = ProjectPhase::whereIn('id', $accessiblePhaseIds)->where('status', ProjectPhaseStatus::Completed)->count();
        $projectProgress = $totalPhases > 0 ? (int) round($completedPhases / $totalPhases * 100) : 0;

        $isOwner = $user->isOwner();

        return Inertia::render('dashboard', [
            'statusCounts' => $statusCounts,
            'openChangeRequestsTotal' => $openChangeRequestsTotal,
            'needsAttention' => $needsAttention,
            'recentActivity' => $recentActivity,
            'reminders' => $reminders,
            'activeTimeEntry' => $activeTimeEntry ? [
                'id' => $activeTimeEntry->id,
                'task' => $activeTimeEntry->task,
                'started_at' => $activeTimeEntry->started_at->toIso8601String(),
                'project' => ['id' => $activeTimeEntry->project->id, 'name' => $activeTimeEntry->project->name],
            ] : null,
            'hoursTrackedToday' => $hoursTrackedToday,
            'tasks' => $tasks,
            'allottedProjects' => $allottedProjects,
            'weeklyActivity' => $weeklyActivity,
            'projectProgress' => $projectProgress,
            'isOwner' => $isOwner,
            'ownerStats' => $isOwner ? [
                'clientsCount' => Client::query()->count(),
                'teamCount' => User::query()->count(),
            ] : null,
        ]);
    }
}
