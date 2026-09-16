<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\DefaultFolderTemplates\StoreDefaultFolderTemplateRequest;
use App\Http\Requests\DefaultFolderTemplates\UpdateDefaultFolderTemplateRequest;
use App\Models\DefaultFolderTemplate;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class DefaultFolderTemplateController extends Controller
{
    public function store(StoreDefaultFolderTemplateRequest $request): RedirectResponse
    {
        $folderTemplate = new DefaultFolderTemplate($request->validated());
        $folderTemplate->sort_order = ((int) DefaultFolderTemplate::query()->max('sort_order')) + 1;
        $folderTemplate->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder added.')]);

        return to_route('phase-templates.index');
    }

    public function update(UpdateDefaultFolderTemplateRequest $request, DefaultFolderTemplate $defaultFolderTemplate): RedirectResponse
    {
        $defaultFolderTemplate->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder updated.')]);

        return to_route('phase-templates.index');
    }

    public function reorder(Request $request): RedirectResponse
    {
        Gate::authorize('create', DefaultFolderTemplate::class);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:default_folder_templates,id'],
        ])['ids'];

        foreach ($ids as $index => $id) {
            DefaultFolderTemplate::where('id', $id)->update(['sort_order' => $index]);
        }

        return back();
    }

    public function destroy(Request $request, DefaultFolderTemplate $defaultFolderTemplate): RedirectResponse
    {
        Gate::authorize('delete', $defaultFolderTemplate);

        $defaultFolderTemplate->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder removed.')]);

        return to_route('phase-templates.index');
    }
}
