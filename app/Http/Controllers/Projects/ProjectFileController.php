<?php

namespace App\Http\Controllers\Projects;

use App\Enums\ProjectActivityType;
use App\Http\Controllers\Controller;
use App\Http\Requests\Files\StoreFileRequest;
use App\Http\Requests\Files\UpdateFileRequest;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectFile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ProjectFileController extends Controller
{
    public function store(StoreFileRequest $request, Project $project): RedirectResponse
    {
        $uploaded = $request->file('file');
        $disk = 'local';
        $path = $uploaded->store("projects/{$project->id}", $disk);

        $file = new ProjectFile(['name' => $uploaded->getClientOriginalName()]);
        $file->project_id = $project->id;
        $file->folder_id = $request->validated('folder_id');
        $file->path = $path;
        $file->disk = $disk;
        $file->mime_type = $uploaded->getClientMimeType();
        $file->size = $uploaded->getSize();
        $file->uploaded_by = $request->user()->id;
        $file->save();

        ProjectActivity::log($project, ProjectActivityType::FileUploaded, $request->user(), $file, [
            'name' => $file->name,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File uploaded.')]);

        return back();
    }

    public function update(UpdateFileRequest $request, Project $project, ProjectFile $file): RedirectResponse
    {
        abort_unless($file->project_id === $project->id, 404);

        $previousName = $file->name;
        $previousFolderId = $file->folder_id;

        $file->fill($request->safe()->only('name'));

        if ($request->has('folder_id')) {
            $file->folder_id = $request->validated('folder_id');
        }

        $file->save();

        $renamed = $file->name !== $previousName;
        $moved = $file->folder_id !== $previousFolderId;

        if ($renamed || $moved) {
            ProjectActivity::log($project, ProjectActivityType::FileUpdated, $request->user(), $file, [
                'renamed' => $renamed,
                'moved' => $moved,
                'old_name' => $previousName,
                'new_name' => $file->name,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File updated.')]);

        return back();
    }

    public function destroy(Request $request, Project $project, ProjectFile $file): RedirectResponse
    {
        abort_unless($file->project_id === $project->id, 404);
        Gate::authorize('delete', $file);

        $name = $file->name;

        Storage::disk($file->disk)->delete($file->path);
        $file->delete();

        ProjectActivity::log($project, ProjectActivityType::FileDeleted, $request->user(), meta: [
            'name' => $name,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => __('File deleted.')]);

        return back();
    }

    public function download(Request $request, Project $project, ProjectFile $file): StreamedResponse
    {
        abort_unless($file->project_id === $project->id, 404);
        Gate::authorize('view', $file);

        return Storage::disk($file->disk)->download($file->path, $file->name);
    }

    /**
     * Same file, served inline instead of as an attachment - for embedding
     * in <img>/<embed> (the Smart Comparison workspace, previews, etc.)
     * rather than triggering a save-file prompt.
     */
    public function view(Request $request, Project $project, ProjectFile $file): StreamedResponse
    {
        abort_unless($file->project_id === $project->id, 404);
        Gate::authorize('view', $file);

        return Storage::disk($file->disk)->response($file->path, $file->name);
    }
}
