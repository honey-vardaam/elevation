<?php

namespace App\Http\Controllers\Projects;

use App\Enums\ActivityStatus;
use App\Enums\PhaseActivityType;
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
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PhaseActivityController extends Controller
{
    private const array TYPE_MAP = [
        'comment' => PhaseActivityType::Comment,
        'change_request' => PhaseActivityType::ChangeRequest,
        'approval' => PhaseActivityType::Approved,
    ];

    public function store(StorePhaseActivityRequest $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);

        $attachmentId = null;
        $isNewUpload = false;

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
            $isNewUpload = true;
        } elseif ($request->validated('attachment_id')) {
            // Referencing a file already in the project's storage - no new
            // ProjectFile row, so it keeps belonging to its folder and isn't
            // duplicated on disk.
            $attachmentId = (int) $request->validated('attachment_id');
        }

        $type = self::TYPE_MAP[$request->validated('type')];

        $activity = new PhaseActivity([
            'type' => $type,
            'body' => $request->validated('body'),
            'parent_id' => $request->validated('parent_id'),
            'reviewer_id' => $type === PhaseActivityType::ChangeRequest ? $request->validated('reviewer_id') : null,
            'activity_status' => $type === PhaseActivityType::ChangeRequest ? ActivityStatus::Open : null,
        ]);
        $activity->project_phase_id = $phase->id;
        $activity->user_id = $request->user()->id;
        $activity->attachment_id = $attachmentId;
        $activity->save();

        if ($isNewUpload) {
            ProjectFile::where('id', $attachmentId)->update(['phase_activity_id' => $activity->id]);
        }

        $actor = $request->user();

        if ($type === PhaseActivityType::ChangeRequest && $activity->reviewer_id) {
            $activity->loadMissing('reviewer');
            $this->notify($activity->reviewer, $phase, $actor, "{$actor->name} asked you to review \"{$phase->name}\".", 'review');
        } elseif ($type === PhaseActivityType::Comment || $type === PhaseActivityType::ChangeRequest) {
            $verb = $type === PhaseActivityType::ChangeRequest ? 'opened a request on' : 'commented on';
            $notificationType = $type === PhaseActivityType::ChangeRequest ? 'change_request' : 'comment';
            $this->notifyProjectMembers($phase, $actor, "{$actor->name} {$verb} \"{$phase->name}\".", $notificationType);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Posted.')]);

        return back();
    }

    public function destroy(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        Gate::authorize('delete', $activity);

        $this->deleteActivityTree($activity);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Deleted.')]);

        return back();
    }

    /**
     * Delete an activity along with every reply beneath it (any depth),
     * cleaning up an attachment from disk only when it was uploaded
     * specifically for that activity rather than referenced from the
     * project's existing file storage.
     */
    private function deleteActivityTree(PhaseActivity $activity): void
    {
        $activity->loadMissing('replies', 'attachment');

        foreach ($activity->replies as $reply) {
            $this->deleteActivityTree($reply);
        }

        $attachment = $activity->attachment;
        if ($attachment && (int) $attachment->phase_activity_id === $activity->id) {
            Storage::disk($attachment->disk)->delete($attachment->path);
            $attachment->delete();
        }

        $activity->delete();
    }

    /**
     * Close or reopen a request. Closing directly (without a reviewer
     * decision) only applies when no reviewer is tagged - a request with a
     * reviewer must go through `decide()` to be closed, though it can still
     * be reopened here regardless of how it reached "resolved".
     */
    public function resolve(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::ChangeRequest, 404);
        $isReopen = $activity->activity_status === ActivityStatus::Resolved;
        abort_unless($isReopen || $activity->reviewer_id === null, 404);
        Gate::authorize('resolve', $activity);

        $actor = $request->user();

        if ($isReopen) {
            $activity->activity_status = ActivityStatus::Open;
            $activity->resolved_at = null;
            $activity->resolved_by = null;
        } else {
            $activity->activity_status = ActivityStatus::Resolved;
            $activity->resolved_at = now();
            $activity->resolved_by = $actor->id;
        }

        $activity->save();

        $activity->loadMissing('author');
        $verb = $isReopen ? 'reopened' : 'resolved';
        $this->notify($activity->author, $phase, $actor, "{$actor->name} {$verb} your request on \"{$phase->name}\".", 'change_request');

        return back();
    }

    /**
     * Approve or request changes on a request that has a tagged reviewer.
     */
    public function decide(DecidePhaseActivityRequest $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::ChangeRequest, 404);
        abort_unless($activity->reviewer_id !== null, 404);
        abort_unless($activity->activity_status === ActivityStatus::Open, 404);

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
            $activity->activity_status = ActivityStatus::Resolved;
            $activity->resolved_at = now();
            $activity->resolved_by = $actor->id;
        } else {
            $activity->activity_status = ActivityStatus::ChangesRequested;
        }

        $activity->save();

        $activity->loadMissing('author');
        $verb = $approved ? 'approved' : 'requested changes on';
        $this->notify($activity->author, $phase, $actor, "{$actor->name} {$verb} your request on \"{$phase->name}\".", $approved ? 'approved' : 'review');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Updated.')]);

        return back();
    }

    /**
     * Put a "changes requested" request back to open, awaiting the
     * reviewer's decision again.
     */
    public function resubmit(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::ChangeRequest, 404);
        abort_unless($activity->activity_status === ActivityStatus::ChangesRequested, 404);
        Gate::authorize('resubmit', $activity);

        $activity->activity_status = ActivityStatus::Open;
        $activity->save();

        $actor = $request->user();
        $activity->loadMissing('reviewer');
        $this->notify($activity->reviewer, $phase, $actor, "{$actor->name} resubmitted \"{$phase->name}\" for your review.", 'review');

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resubmitted for review.')]);

        return back();
    }

    /**
     * Notify every user with access to the phase's project (owner and
     * members alike) except the actor who triggered the event.
     */
    private function notifyProjectMembers(ProjectPhase $phase, User $actor, string $message, string $type): void
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

        Notification::send($recipients, new PhaseActivityNotification($phase, $actor, $message, $type));
    }

    /**
     * Notify a single user about a phase event, skipping if there's no
     * recipient or the recipient is the one who caused the event.
     */
    private function notify(?User $recipient, ProjectPhase $phase, User $actor, string $message, string $type): void
    {
        if ($recipient === null || $recipient->id === $actor->id) {
            return;
        }

        $recipient->notify(new PhaseActivityNotification($phase, $actor, $message, $type));
    }
}
