<?php

namespace App\Notifications;

use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Notifications\Notification;

/**
 * A single, message-carrying notification for phase collaboration events
 * (new comments, change requests, review requests/decisions). The message
 * is composed by the caller so this class stays event-agnostic.
 */
class PhaseActivityNotification extends Notification
{
    public function __construct(
        private readonly ProjectPhase $phase,
        private readonly User $actor,
        private readonly string $message,
    ) {}

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->phase->project_id,
            'project_name' => $this->phase->project->name,
            'phase_id' => $this->phase->id,
            'phase_name' => $this->phase->name,
            'actor_name' => $this->actor->name,
            'message' => $this->message,
        ];
    }
}
