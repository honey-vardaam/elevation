<?php

namespace App\Http\Controllers;

use App\Models\CalendarEvent;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class CalendarController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $anchor = $this->resolveAnchor($request->query('month'));
        $monthStart = $anchor->copy()->startOfMonth();
        $monthEnd = $anchor->copy()->endOfMonth();
        $gridStart = $monthStart->copy()->startOfWeek(Carbon::SUNDAY);
        $gridEnd = $monthEnd->copy()->endOfWeek(Carbon::SUNDAY);

        $events = CalendarEvent::query()
            ->where('user_id', $user->id)
            ->whereBetween('start_at', [$gridStart, $gridEnd])
            ->with('project:id,name')
            ->orderBy('start_at')
            ->get()
            ->map(fn (CalendarEvent $event) => [
                'id' => $event->id,
                'title' => $event->title,
                'description' => $event->description,
                'start_at' => $event->start_at->toIso8601String(),
                'end_at' => $event->end_at?->toIso8601String(),
                'all_day' => $event->all_day,
                'remind_minutes_before' => $event->remind_minutes_before,
                'project' => $event->project
                    ? ['id' => $event->project->id, 'name' => $event->project->name]
                    : null,
            ]);

        $accessibleProjects = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->orderBy('name')
            ->get(['id', 'name', 'status', 'start_date', 'end_date']);

        $daysInMonth = $monthStart->daysInMonth;

        $projectTimeline = $accessibleProjects
            ->filter(fn (Project $project) => $project->start_date !== null
                && $project->start_date->lte($monthEnd)
                && ($project->end_date === null || $project->end_date->gte($monthStart)))
            ->map(function (Project $project) use ($monthStart, $monthEnd, $daysInMonth) {
                $barStart = $project->start_date->lt($monthStart) ? $monthStart->copy() : $project->start_date->copy();
                $barEnd = ($project->end_date === null || $project->end_date->gt($monthEnd))
                    ? $monthEnd->copy()
                    : $project->end_date->copy();

                $startOffsetDays = $monthStart->diffInDays($barStart);
                $spanDays = $barStart->diffInDays($barEnd) + 1;

                return [
                    'id' => $project->id,
                    'name' => $project->name,
                    'status' => $project->status->value,
                    'start_date' => $project->start_date->toDateString(),
                    'end_date' => $project->end_date?->toDateString(),
                    'start_offset_pct' => round($startOffsetDays / $daysInMonth * 100, 2),
                    'width_pct' => round($spanDays / $daysInMonth * 100, 2),
                ];
            })
            ->values();

        return Inertia::render('calendar/index', [
            'month' => $anchor->format('Y-m'),
            'events' => $events,
            'projects' => $accessibleProjects->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
            ])->values(),
            'projectTimeline' => $projectTimeline,
        ]);
    }

    private function resolveAnchor(?string $month): Carbon
    {
        if ($month) {
            try {
                return Carbon::createFromFormat('Y-m', $month)->startOfMonth();
            } catch (\Throwable) {
                // Fall through to the default below.
            }
        }

        return Carbon::now()->startOfMonth();
    }
}
