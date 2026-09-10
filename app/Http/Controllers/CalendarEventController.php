<?php

namespace App\Http\Controllers;

use App\Http\Requests\Calendar\StoreCalendarEventRequest;
use App\Http\Requests\Calendar\UpdateCalendarEventRequest;
use App\Models\CalendarEvent;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class CalendarEventController extends Controller
{
    public function store(StoreCalendarEventRequest $request): RedirectResponse
    {
        $event = new CalendarEvent($this->attributesFrom($request->validated()));
        $event->user_id = $request->user()->id;
        $event->project_id = $request->validated('project_id');
        $event->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event added.')]);

        return back();
    }

    public function update(UpdateCalendarEventRequest $request, CalendarEvent $calendarEvent): RedirectResponse
    {
        $calendarEvent->fill($this->attributesFrom($request->validated()));
        $calendarEvent->project_id = $request->validated('project_id');

        // A moved or edited event should be able to remind again.
        $calendarEvent->reminded_at = null;
        $calendarEvent->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event updated.')]);

        return back();
    }

    public function destroy(Request $request, CalendarEvent $calendarEvent): RedirectResponse
    {
        Gate::authorize('delete', $calendarEvent);

        $calendarEvent->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Event deleted.')]);

        return back();
    }

    /**
     * Combine the separate date/time inputs into start_at/end_at and drop
     * the fields CalendarEvent doesn't store directly.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function attributesFrom(array $data): array
    {
        $allDay = (bool) ($data['all_day'] ?? false);

        $startAt = Carbon::parse($data['start_date'].' '.($allDay ? '00:00' : ($data['start_time'] ?? '00:00')));

        $endAt = null;

        if (! empty($data['end_date'])) {
            $endAt = Carbon::parse($data['end_date'].' '.($allDay ? '23:59' : ($data['end_time'] ?? $data['start_time'] ?? '23:59')));
        }

        return [
            'title' => $data['title'],
            'description' => $data['description'] ?? null,
            'all_day' => $allDay,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'remind_minutes_before' => $data['remind_minutes_before'] ?? null,
        ];
    }
}
