<?php

namespace App\Http\Controllers;

use App\Http\Requests\TimeTracker\StoreTimeEntryRequest;
use App\Models\TimeEntry;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;

class TimeTrackerController extends Controller
{
    public function store(StoreTimeEntryRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request) {
            TimeEntry::query()
                ->where('user_id', $request->user()->id)
                ->whereNull('ended_at')
                ->update(['ended_at' => now()]);

            $entry = new TimeEntry(['task' => $request->validated('task')]);
            $entry->user_id = $request->user()->id;
            $entry->project_id = $request->validated('project_id');
            $entry->started_at = now();
            $entry->save();
        });

        return back();
    }

    public function stop(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('update', $timeEntry);

        abort_unless($timeEntry->ended_at === null, 404);

        $timeEntry->ended_at = now();
        $timeEntry->save();

        return back();
    }

    public function pause(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('update', $timeEntry);

        abort_unless($timeEntry->isRunning(), 404);

        $timeEntry->paused_at = now();
        $timeEntry->save();

        return back();
    }

    /**
     * Resume a paused entry by shifting its start time forward by however
     * long it sat paused, so the elapsed time it reports keeps excluding
     * that gap rather than needing a separate accumulated-duration field.
     */
    public function resume(Request $request, TimeEntry $timeEntry): RedirectResponse
    {
        Gate::authorize('update', $timeEntry);

        abort_unless($timeEntry->isPaused(), 404);

        $pausedSeconds = $timeEntry->paused_at->diffInSeconds(now());
        $timeEntry->started_at = $timeEntry->started_at->addSeconds($pausedSeconds);
        $timeEntry->paused_at = null;
        $timeEntry->save();

        return back();
    }
}
