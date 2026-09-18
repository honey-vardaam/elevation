<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhaseFlowTemplates\StorePhaseFlowTemplateRequest;
use App\Http\Requests\PhaseFlowTemplates\UpdatePhaseFlowTemplateRequest;
use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use App\Support\PhaseFlowChain;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PhaseFlowTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PhaseFlowTemplate::class);

        $flows = PhaseFlowTemplate::query()
            ->withCount('steps')
            ->with('steps:id,phase_flow_template_id,next_phase_template_id')
            ->latest()
            ->get()
            ->map(fn (PhaseFlowTemplate $flow) => [
                'id' => $flow->id,
                'name' => $flow->name,
                'description' => $flow->description,
                'steps_count' => $flow->steps_count,
                'is_ready' => $flow->isReady(),
            ]);

        return Inertia::render('settings/phase-flows/index', [
            'phaseFlowTemplates' => $flows,
        ]);
    }

    public function store(StorePhaseFlowTemplateRequest $request): RedirectResponse
    {
        $flow = PhaseFlowTemplate::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase flow created.')]);

        return to_route('phase-flow-templates.show', $flow);
    }

    public function show(Request $request, PhaseFlowTemplate $phaseFlowTemplate): Response
    {
        Gate::authorize('viewAny', PhaseFlowTemplate::class);

        $steps = $phaseFlowTemplate->steps()->get();

        return Inertia::render('phase-flows/edit', [
            'flow' => [
                'id' => $phaseFlowTemplate->id,
                'name' => $phaseFlowTemplate->name,
                'description' => $phaseFlowTemplate->description,
                'is_ready' => $steps->isNotEmpty() && PhaseFlowChain::walk($steps) !== null,
                'steps' => $steps->map(fn (PhaseTemplate $step) => [
                    'id' => $step->id,
                    'name' => $step->name,
                    'description' => $step->description,
                    'position_x' => $step->position_x,
                    'position_y' => $step->position_y,
                    'next_phase_template_id' => $step->next_phase_template_id,
                ]),
            ],
            'can' => [
                'update' => Gate::allows('update', $phaseFlowTemplate),
                'delete' => Gate::allows('delete', $phaseFlowTemplate),
            ],
        ]);
    }

    public function update(UpdatePhaseFlowTemplateRequest $request, PhaseFlowTemplate $phaseFlowTemplate): RedirectResponse
    {
        $phaseFlowTemplate->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase flow updated.')]);

        return back();
    }

    public function destroy(Request $request, PhaseFlowTemplate $phaseFlowTemplate): RedirectResponse
    {
        Gate::authorize('delete', $phaseFlowTemplate);

        $phaseFlowTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase flow deleted.')]);

        return to_route('phase-flow-templates.index');
    }
}
