<?php

namespace App\Http\Controllers\Projects;

use App\Http\Controllers\Controller;
use App\Http\Requests\Folders\StoreFolderRequest;
use App\Http\Requests\Folders\UpdateFolderRequest;
use App\Models\Folder;
use App\Models\Project;
use App\Models\ProjectFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class FolderController extends Controller
{
    public function store(StoreFolderRequest $request, Project $project): RedirectResponse
    {
        $folder = new Folder($request->safe()->only('name'));
        $folder->project_id = $project->id;
        $folder->parent_id = $request->validated('parent_id');
        $folder->created_by = $request->user()->id;
        $folder->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder created.')]);

        return back();
    }

    public function update(UpdateFolderRequest $request, Project $project, Folder $folder): RedirectResponse
    {
        abort_unless($folder->project_id === $project->id, 404);

        $folder->fill($request->safe()->only('name'));

        if ($request->has('parent_id')) {
            $folder->parent_id = $request->validated('parent_id');
        }

        $folder->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder updated.')]);

        return back();
    }

    public function destroy(Request $request, Project $project, Folder $folder): RedirectResponse
    {
        abort_unless($folder->project_id === $project->id, 404);
        Gate::authorize('delete', $folder);

        $allFolders = $project->folders()->get(['id', 'parent_id']);
        $subtreeIds = [$folder->id];
        $queue = [$folder->id];

        while ($queue !== []) {
            $currentId = array_shift($queue);
            $children = $allFolders->where('parent_id', $currentId)->pluck('id')->all();
            $subtreeIds = array_merge($subtreeIds, $children);
            $queue = array_merge($queue, $children);
        }

        $files = ProjectFile::query()->whereIn('folder_id', $subtreeIds)->get();

        foreach ($files as $file) {
            Storage::disk($file->disk)->delete($file->path);
        }

        // Deletes the folder row; DB FK cascades remove descendant folder
        // and file rows automatically.
        $folder->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Folder deleted.')]);

        return back();
    }
}
