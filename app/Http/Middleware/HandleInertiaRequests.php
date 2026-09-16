<?php

namespace App\Http\Middleware;

use App\Models\CalendarEvent;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'dueReminders' => fn () => $this->dueReminders($request),
            'notifications' => fn () => $this->notifications($request),
        ];
    }

    /**
     * Calendar events whose reminder time has arrived, not yet shown to the
     * user. Marks them as shown so they aren't repeated on the next request.
     *
     * @return array<int, array<string, mixed>>
     */
    private function dueReminders(Request $request): array
    {
        $user = $request->user();

        if (! $user) {
            return [];
        }

        $now = Carbon::now();

        $candidates = CalendarEvent::query()
            ->where('user_id', $user->id)
            ->whereNotNull('remind_minutes_before')
            ->whereNull('reminded_at')
            ->where('start_at', '<=', $now->copy()->addDays(7))
            ->orderBy('start_at')
            ->limit(20)
            ->get();

        $due = $candidates->filter->isReminderDue()->take(5)->values();

        if ($due->isEmpty()) {
            return [];
        }

        CalendarEvent::whereIn('id', $due->pluck('id'))->update(['reminded_at' => $now]);

        return $due->map(fn (CalendarEvent $event) => [
            'id' => $event->id,
            'title' => $event->title,
            'start_at' => $event->start_at->toIso8601String(),
            'all_day' => $event->all_day,
        ])->all();
    }

    /**
     * The current user's most recent notifications plus their unread count,
     * for the notification bell/panel available on every page.
     *
     * @return array<string, mixed>
     */
    private function notifications(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        if (! $user) {
            return ['unread_count' => 0, 'items' => []];
        }

        $items = $user->notifications()->latest()->limit(20)->get();

        return [
            'unread_count' => $user->unreadNotifications()->count(),
            'items' => $items->map(fn ($notification) => [
                'id' => $notification->id,
                'read_at' => $notification->read_at?->toIso8601String(),
                'created_at' => $notification->created_at->toIso8601String(),
                ...$notification->data,
            ])->all(),
        ];
    }
}
