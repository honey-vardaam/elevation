<?php

namespace App\Http\Controllers\Projects;

use App\Enums\PhaseActivityType;
use App\Enums\ProjectPhaseStatus;
use App\Enums\ProjectStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Projects\StoreProjectPhaseRequest;
use App\Http\Requests\Projects\UpdateProjectPhaseRequest;
use App\Models\PhaseActivity;
use App\Models\PhaseTemplate;
use App\Models\Project;
use App\Models\ProjectPhase;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class ProjectPhaseController extends Controller
{
    public function store(StoreProjectPhaseRequest $request, Project $project): RedirectResponse
    {
        $template = PhaseTemplate::findOrFail((int) $request->validated('phase_template_id'));

        $phase = new ProjectPhase(['name' => $template->name]);
        $phase->project_id = $project->id;
        $phase->phase_template_id = $template->id;
        $phase->sort_order = ((int) $project->phases()->max('sort_order')) + 1;
        $phase->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase added.')]);

        return back();
    }

    public function update(UpdateProjectPhaseRequest $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);

        $previousStatus = $phase->status;

        $phase->fill($request->validated());
        $phase->save();

        if ($phase->status !== $previousStatus) {
            $this->logStatusChange($phase, $request->user()->id, $previousStatus, $phase->status);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase updated.')]);

        return back();
    }

    /**
     * Complete this phase and start the next one in the pipeline, or - if
     * this was the last phase - mark the whole project Completed. Either
     * way, the transition is recorded on the timeline.
     *
     * Row-locks the phase (and project, when completing it) inside the
     * transaction and bails out if it's already completed - without this,
     * two managers clicking "advance" at the same moment could both see
     * the phase as not-yet-completed and double-advance the pipeline or
     * double-log the project-completed activity.
     */
    public function advance(Request $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        Gate::authorize('advance', $phase);

        DB::transaction(function () use ($request, $project, $phase) {
            $lockedPhase = ProjectPhase::whereKey($phase->id)->lockForUpdate()->firstOrFail();

            if ($lockedPhase->status === ProjectPhaseStatus::Completed) {
                return;
            }

            $previousStatus = $lockedPhase->status;
            $lockedPhase->status = ProjectPhaseStatus::Completed;
            $lockedPhase->save();
            $this->logStatusChange($lockedPhase, $request->user()->id, $previousStatus, $lockedPhase->status);

            $nextPhase = $project->phases()
                ->where('sort_order', '>', $lockedPhase->sort_order)
                ->orderBy('sort_order')
                ->lockForUpdate()
                ->first();

            if ($nextPhase !== null) {
                if ($nextPhase->status === ProjectPhaseStatus::Pending) {
                    $nextPreviousStatus = $nextPhase->status;
                    $nextPhase->status = ProjectPhaseStatus::InProgress;
                    $nextPhase->save();
                    $this->logStatusChange($nextPhase, $request->user()->id, $nextPreviousStatus, $nextPhase->status);
                }
            } else {
                $lockedProject = Project::whereKey($project->id)->lockForUpdate()->firstOrFail();

                if ($lockedProject->status !== ProjectStatus::Completed) {
                    $lockedProject->status = ProjectStatus::Completed;
                    $lockedProject->save();

                    $completedActivity = new PhaseActivity(['type' => PhaseActivityType::ProjectCompleted]);
                    $completedActivity->project_phase_id = $lockedPhase->id;
                    $completedActivity->user_id = $request->user()->id;
                    $completedActivity->save();
                }
            }
        });

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase advanced.')]);

        return back();
    }

    private function logStatusChange(ProjectPhase $phase, int $userId, ProjectPhaseStatus $from, ProjectPhaseStatus $to): void
    {
        $activity = new PhaseActivity([
            'type' => PhaseActivityType::StatusChanged,
            'meta' => ['from' => $from->value, 'to' => $to->value],
        ]);
        $activity->project_phase_id = $phase->id;
        $activity->user_id = $userId;
        $activity->save();
    }

    public function reorder(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('update', $project);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:project_phases,id'],
        ])['ids'];

        foreach ($ids as $index => $id) {
            ProjectPhase::where('id', $id)
                ->where('project_id', $project->id)
                ->update(['sort_order' => $index]);
        }

        return back();
    }

    public function destroy(Request $request, Project $project, ProjectPhase $phase): RedirectResponse
    {
        abort_unless($phase->project_id === $project->id, 404);
        Gate::authorize('delete', $phase);

        $phase->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase removed.')]);

        return back();
    }
}
