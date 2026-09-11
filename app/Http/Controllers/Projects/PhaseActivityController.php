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
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
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

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Posted.')]);

        return back();
    }

    public function resolve(Request $request, Project $project, ProjectPhase $phase, PhaseActivity $activity): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        abort_unless($activity->project_phase_id === $phase->id, 404);
        abort_unless($activity->type === PhaseActivityType::ChangeRequest, 404);
        Gate::authorize('resolve', $activity);

        if ($activity->resolved_at === null) {
            $activity->resolved_at = now();
            $activity->resolved_by = $request->user()->id;
        } else {
            $activity->resolved_at = null;
            $activity->resolved_by = null;
        }

        $activity->save();

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

        if ($request->validated('decision') === 'approved') {
            $activity->review_status = ReviewStatus::Approved;
            $activity->resolved_at = now();
            $activity->resolved_by = $request->user()->id;
        } else {
            $activity->review_status = ReviewStatus::ChangesRequested;
        }

        $activity->save();

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

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Resubmitted for review.')]);

        return back();
    }
}
