<?php

namespace App\Http\Controllers\Projects;

use App\Enums\PhaseActivityType;
use App\Enums\ReviewStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\DecidePhaseActivityRequest;
use App\Http\Requests\Projects\StorePhaseActivityRequest;
use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectPhase;
use App\Models\User;
use App\Notifications\PhaseActivityNotification;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Notification;
use Inertia\Inertia;

class PhaseActivityController extends Controller
{
    private const array TYPE_MAP = [
        'comment' => PhaseActivityType::Comment,
        'change_request' => PhaseActivityType::ChangeRequest,
        'review' => PhaseActivityType::Review,
        'approval' => PhaseActivityType::Approved,
    ];

    public function store(StorePhaseActivityRequest $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);

        $attachmentId = null;

        if ($request->hasFile('attachment')) {
            $uploaded = $request->file('attachment');
            $path = $uploaded->store("projects/{$project->id}/phase-activities", 'local');

            $file = new ProjectFile(['name' => $uploaded->getClientOriginalName()]);
            $file->project_id = $project->id;
            $file->path = $path;
            $file->disk = 'local';
            $file->mime_type = $uploaded->getClientMimeType();
            $file->size = $uploaded->getSize();
            $file->uploaded_by = $request->user()->id;
            $file->save();

            $attachmentId = $file->id;
        }

        $type = self::TYPE_MAP[$request->validated('type')];

        $activity = new PhaseActivity([
            'type' => $type,
            'body' => $request->validated('body'),
            'parent_id' => $request->validated('parent_id'),
            'reviewer_id' => $type === PhaseActivityType::Review ? $request->validated('reviewer_id') : null,
            'review_status' => $type === PhaseActivityType::Review ? ReviewStatus::Pending : null,
        ]);
        $activity->project_phase_id = $phase->id;
        $activity->user_id = $request->user()->id;
        $activity->attachment_id = $attachmentId;
        $activity->save();

        if ($attachmentId !== null) {
            ProjectFile::where('id', $attachmentId)->update(['phase_activity_id' => $activity->id]);
        }

        $actor = $request->user();

        if ($type === PhaseActivityType::Review && $activity->reviewer_id) {
            $activity->loadMissing('reviewer');
            $this->notify($activity->reviewer, $phase, $actor, "{$actor->name} asked you to review \"{$phase->name}\".");
        } elseif ($type === PhaseActivityType::Comment || $type === PhaseActivityType::ChangeRequest) {
            $verb = $type === PhaseActivityType::ChangeRequest ? 'requested changes on' : 'commented on';
            $this->notifyProjectMembers($phase, $actor, "{$actor->name} {$verb} \"{$phase->name}\".");
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Posted.')]);

        return back();
    }

    public function resolve(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::ChangeRequest, 404);
        Gate::authorize('resolve', $activity);

        $actor = $request->user();
        $wasResolved = $activity->resolved_at !== null;

        if ($wasResolved) {
            $activity->resolved_at = null;
            $activity->resolved_by = null;
        } else {
            $activity->resolved_at = now();
            $activity->resolved_by = $actor->id;
        }

        $activity->save();

        $activity->loadMissing('author');
        $verb = $wasResolved ? 'reopened' : 'resolved';
        $this->notify($activity->author, $phase, $actor, "{$actor->name} {$verb} your change request on \"{$phase->name}\".");

        return back();
    }

    public function decide(DecidePhaseActivityRequest $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::Review, 404);
        abort_unless($activity->review_status === ReviewStatus::Pending, 404);

        if ($request->validated('note')) {
            $reply = new PhaseActivity([
                'type' => PhaseActivityType::Comment,
                'body' => $request->validated('note'),
                'parent_id' => $activity->id,
            ]);
            $reply->project_phase_id = $phase->id;
            $reply->user_id = $request->user()->id;
            $reply->save();
        }

        $actor = $request->user();
        $approved = $request->validated('decision') === 'approved';

        if ($approved) {
            $activity->review_status = ReviewStatus::Approved;
            $activity->resolved_at = now();
            $activity->resolved_by = $actor->id;
        } else {
            $activity->review_status = ReviewStatus::ChangesRequested;
        }

        $activity->save();

        $activity->loadMissing('author');
        $verb = $approved ? 'approved' : 'requested changes on';
        $this->notify($activity->author, $phase, $actor, "{$actor->name} {$verb} your review of \"{$phase->name}\".");

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Review updated.')]);

        return back();
    }

    public function resubmit(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::Review, 404);
        abort_unless($activity->review_status === ReviewStatus::ChangesRequested, 404);
        Gate::authorize('resubmit', $activity);

        $activity->review_status = ReviewStatus::Pending;
        $activity->save();

        $actor = $request->user();
        $activity->loadMissing('reviewer');
        $this->notify($activity->reviewer, $phase, $actor, "{$actor->name} resubmitted \"{$phase->name}\" for your review.");

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resubmitted for review.')]);

        return back();
    }

    /**
     * Notify every user with access to the phase's project (owner and
     * members alike) except the actor who triggered the event.
     */
    private function notifyProjectMembers(ProjectPhase $phase, User $actor, string $message): void
    {
        $phase->loadMissing('project.members.user', 'project.owner');

        /** @var Collection<int, User> $recipients */
        $recipients = $phase->project->members
            ->pluck('user')
            ->push($phase->project->owner)
            ->filter(fn (?User $user) => $user !== null && $user->id !== $actor->id)
            ->unique('id')
            ->values();

        if ($recipients->isEmpty()) {
            return;
        }

        Notification::send($recipients, new PhaseActivityNotification($phase, $actor, $message));
    }

    /**
     * Notify a single user about a phase event, skipping if there's no
     * recipient or the recipient is the one who caused the event.
     */
    private function notify(?User $recipient, ProjectPhase $phase, User $actor, string $message): void
    {
        if ($recipient === null || $recipient->id === $actor->id) {
            return;
        }

        $recipient->notify(new PhaseActivityNotification($phase, $actor, $message));
    }
}
