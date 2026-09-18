<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhaseFlowSteps\ConnectPhaseFlowStepRequest;
use App\Http\Requests\PhaseFlowSteps\StorePhaseFlowStepRequest;
use App\Http\Requests\PhaseFlowSteps\UpdatePhaseFlowStepRequest;
use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use App\Support\PhaseFlowChain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PhaseFlowStepController extends Controller
{
    public function store(StorePhaseFlowStepRequest $request, PhaseFlowTemplate $phaseFlowTemplate): RedirectResponse
    {
        $rightmostX = (int) $phaseFlowTemplate->steps()->max('position_x');

        $step = new PhaseTemplate($request->validated());
        $step->phase_flow_template_id = $phaseFlowTemplate->id;
        $step->position_x = $request->input('position_x') ?? ($phaseFlowTemplate->steps()->exists() ? $rightmostX + 260 : 0);
        $step->position_y = $request->input('position_y') ?? 0;
        $step->save();

        return back();
    }

    public function update(UpdatePhaseFlowStepRequest $request, PhaseFlowTemplate $phaseFlowTemplate, PhaseTemplate $step): RedirectResponse
    {
        abort_unless($step->phase_flow_template_id === $phaseFlowTemplate->id, 404);

        $step->fill($request->validated());
        $step->save();

        return back();
    }

    /**
     * Draws or removes this step's one outgoing connection. The whole
     * flow's graph (with this change hypothetically applied) is re-walked
     * before saving, so a connection that would create a branch or a cycle
     * is rejected instead of silently corrupting the chain.
     */
    public function connect(ConnectPhaseFlowStepRequest $request, PhaseFlowTemplate $phaseFlowTemplate, PhaseTemplate $step): RedirectResponse
    {
        abort_unless($step->phase_flow_template_id === $phaseFlowTemplate->id, 404);

        $nextId = $request->validated('next_phase_template_id');

        $hypothetical = $phaseFlowTemplate->steps()->get()->map(function (PhaseTemplate $candidate) use ($step, $nextId) {
            if ($candidate->id === $step->id) {
                $candidate = clone $candidate;
                $candidate->next_phase_template_id = $nextId;
            }

            return $candidate;
        });

        if ($nextId !== null && PhaseFlowChain::walk($hypothetical) === null) {
            return back()->withErrors([
                'next_phase_template_id' => __('That connection would branch or loop the flow - each step can only lead to one other step.'),
            ]);
        }

        $step->next_phase_template_id = $nextId;
        $step->save();

        return back();
    }

    /**
     * If the deleted step had both a predecessor and a successor, splice
     * the chain so removing a middle step doesn't fragment the flow.
     */
    public function destroy(Request $request, PhaseFlowTemplate $phaseFlowTemplate, PhaseTemplate $step): RedirectResponse
    {
        abort_unless($step->phase_flow_template_id === $phaseFlowTemplate->id, 404);
        Gate::authorize('update', $phaseFlowTemplate);

        $previous = PhaseTemplate::where('next_phase_template_id', $step->id)->first();
        $nextId = $step->next_phase_template_id;

        // Clear the step's own outgoing edge first, so briefly having both
        // it and its predecessor point at the same successor never trips
        // the next_phase_template_id unique constraint below.
        if ($nextId !== null) {
            $step->next_phase_template_id = null;
            $step->save();
        }

        if ($previous !== null) {
            $previous->next_phase_template_id = $nextId;
            $previous->save();
        }

        $step->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Step removed.')]);

        return back();
    }
}
