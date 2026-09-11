<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\PhaseTemplates\StorePhaseTemplateRequest;
use App\Http\Requests\PhaseTemplates\UpdatePhaseTemplateRequest;
use App\Models\PhaseTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class PhaseTemplateController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', PhaseTemplate::class);

        $phaseTemplates = PhaseTemplate::query()
            ->orderBy('sort_order')
            ->get()
            ->map(fn (PhaseTemplate $template) => [
                'id' => $template->id,
                'name' => $template->name,
                'description' => $template->description,
                'sort_order' => $template->sort_order,
            ]);

        return Inertia::render('settings/phase-templates', [
            'phaseTemplates' => $phaseTemplates,
        ]);
    }

    public function store(StorePhaseTemplateRequest $request): RedirectResponse
    {
        $phaseTemplate = new PhaseTemplate($request->validated());
        $phaseTemplate->sort_order = ((int) PhaseTemplate::query()->max('sort_order')) + 1;
        $phaseTemplate->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase added.')]);

        return to_route('phase-templates.index');
    }

    public function update(UpdatePhaseTemplateRequest $request, PhaseTemplate $phaseTemplate): RedirectResponse
    {
        $phaseTemplate->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase updated.')]);

        return to_route('phase-templates.index');
    }

    public function reorder(Request $request): RedirectResponse
    {
        Gate::authorize('create', PhaseTemplate::class);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:phase_templates,id'],
        ])['ids'];

        foreach ($ids as $index => $id) {
            PhaseTemplate::where('id', $id)->update(['sort_order' => $index]);
        }

        return back();
    }

    public function destroy(Request $request, PhaseTemplate $phaseTemplate): RedirectResponse
    {
        Gate::authorize('delete', $phaseTemplate);

        $phaseTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Phase removed.')]);

        return to_route('phase-templates.index');
    }
}
