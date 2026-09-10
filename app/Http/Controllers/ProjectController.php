<?php

namespace App\Http\Controllers;

use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProjectController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $projects = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->withCount(['members', 'folders', 'files'])
            ->with('owner:id,name')
            ->latest()
            ->get()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner' => ['id' => $project->owner->id, 'name' => $project->owner->name],
                'role' => $project->roleValueFor($user),
                'members_count' => $project->members_count,
                'folders_count' => $project->folders_count,
                'files_count' => $project->files_count,
                'can' => $project->abilitiesFor($user),
            ]);

        return Inertia::render('projects/index', [
            'projects' => $projects,
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = new Project($request->validated());
        $project->owner_id = $request->user()->id;
        $project->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project created.')]);

        return to_route('projects.show', $project);
    }

    public function show(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $user = $request->user();
        $view = $request->query('view') === 'list' ? 'list' : 'folder';
        $folderId = $request->query('folder') ? (int) $request->query('folder') : null;

        // One query for the whole tree - breadcrumbs/children are built in
        // memory instead of resolving ->parent recursively per request.
        $allFolders = $project->folders()->get(['id', 'parent_id', 'name']);

        $currentFolder = null;
        $breadcrumbTrail = [];

        if ($folderId !== null) {
            $currentFolder = $allFolders->firstWhere('id', $folderId);

            if ($currentFolder === null) {
                abort(404);
            }

            $node = $currentFolder;
            while ($node !== null) {
                array_unshift($breadcrumbTrail, ['id' => $node->id, 'name' => $node->name]);
                $node = $node->parent_id !== null ? $allFolders->firstWhere('id', $node->parent_id) : null;
            }
        }

        if ($view === 'list') {
            $files = $project->files()
                ->with(['folder:id,name', 'uploadedBy:id,name'])
                ->latest()
                ->get()
                ->map(fn ($file) => $this->fileToArray($file, $project, $user, includeFolder: true));

            $folders = [];
        } else {
            $childFolders = $allFolders
                ->where('parent_id', $folderId)
                ->map(fn ($folder) => [
                    'id' => $folder->id,
                    'name' => $folder->name,
                ])
                ->values();

            $files = $project->files()
                ->where('folder_id', $folderId)
                ->with('uploadedBy:id,name')
                ->latest()
                ->get()
                ->map(fn ($file) => $this->fileToArray($file, $project, $user));

            $folders = $childFolders;
        }

        return Inertia::render('projects/show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
                'description' => $project->description,
                'owner' => ['id' => $project->owner->id, 'name' => $project->owner->name],
                'role' => $project->roleValueFor($user),
                'can' => $project->abilitiesFor($user),
                'members' => $project->members()
                    ->with('user:id,name,email')
                    ->get()
                    ->map(fn ($member) => [
                        'id' => $member->id,
                        'role' => $member->role->value,
                        'user' => ['id' => $member->user->id, 'name' => $member->user->name, 'email' => $member->user->email],
                    ]),
            ],
            'view' => $view,
            'currentFolder' => $currentFolder ? ['id' => $currentFolder->id, 'name' => $currentFolder->name] : null,
            'breadcrumbTrail' => $breadcrumbTrail,
            'folders' => $folders,
            'files' => $files,
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->fill($request->validated())->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return to_route('projects.show', $project);
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        foreach ($project->files as $file) {
            Storage::disk($file->disk)->delete($file->path);
        }

        $project->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project deleted.')]);

        return to_route('projects.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function fileToArray(ProjectFile $file, Project $project, User $user, bool $includeFolder = false): array
    {
        $data = [
            'id' => $file->id,
            'name' => $file->name,
            'size' => $file->size,
            'mime_type' => $file->mime_type,
            'uploaded_by' => ['id' => $file->uploadedBy->id, 'name' => $file->uploadedBy->name],
            'created_at' => $file->created_at->toIso8601String(),
            'can' => [
                'edit' => $project->isEditableBy($user),
                'delete' => $project->isManagedBy($user),
            ],
        ];

        if ($includeFolder) {
            $data['folder'] = $file->folder ? ['id' => $file->folder->id, 'name' => $file->folder->name] : null;
        }

        return $data;
    }
}
