<?php

namespace App\Http\Controllers;

use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Models\PhaseActivity;
use App\Models\PhaseTemplate;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\User;
use App\Support\PhaseActivityPresenter;
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
        $canCreate = Gate::allows('create', Project::class);

        $projects = Project::query()
            ->where('owner_id', $user->id)
            ->orWhereHas('members', fn ($query) => $query->where('user_id', $user->id))
            ->withCount(['members', 'folders', 'files'])
            ->with('owner:id,name')
            ->latest()
            ->get()
            ->map(fn (Project $project) => [
                ...$this->projectSummary($project, $user),
                'members_count' => $project->members_count,
                'folders_count' => $project->folders_count,
                'files_count' => $project->files_count,
            ]);

        return Inertia::render('projects/index', [
            'projects' => $projects,
            'can' => ['create' => $canCreate],
            'assignableUsers' => $canCreate
                ? User::query()->orderBy('name')->get(['id', 'name', 'email'])
                : [],
            'hasPhaseTemplates' => PhaseTemplate::query()->exists(),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = new Project($request->safe()->except(['banner', 'use_default_folders', 'apply_phase_pipeline', 'members']));
        $project->owner_id = $request->user()->id;
        $project->save();

        if ($request->hasFile('banner')) {
            $project->banner_path = $request->file('banner')->store('projects/banners', 'public');
            $project->save();
        }

        foreach ($request->validated('members', []) as $member) {
            $projectMember = new ProjectMember(['role' => $member['role']]);
            $projectMember->project_id = $project->id;
            $projectMember->user_id = $member['user_id'];
            $projectMember->save();
        }

        if ($request->boolean('use_default_folders')) {
            $project->seedDefaultFolders($request->user());
        }

        if ($request->boolean('apply_phase_pipeline')) {
            $project->seedPhasesFromTemplates();
        }

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

        $canManagePhases = $project->isManagedBy($user);

        $phaseModels = $project->phases()->get();

        $phases = $phaseModels->map(fn (ProjectPhase $phase) => [
            'id' => $phase->id,
            'name' => $phase->name,
            'status' => $phase->status->value,
            'start_date' => $phase->start_date?->toDateString(),
            'end_date' => $phase->end_date?->toDateString(),
            'notes' => $phase->notes,
            'phase_template_id' => $phase->phase_template_id,
            'open_change_requests_count' => $phase->openChangeRequestsCount(),
        ]);

        $availablePhaseTemplates = $canManagePhases
            ? PhaseTemplate::query()
                ->orderBy('sort_order')
                ->get()
                ->reject(fn (PhaseTemplate $template) => $phases->contains('phase_template_id', $template->id))
                ->values()
                ->map(fn (PhaseTemplate $template) => ['id' => $template->id, 'name' => $template->name])
            : [];

        $activePhaseId = $request->query('panel') ? (int) $request->query('panel') : null;
        $activePhase = $activePhaseId !== null ? $phaseModels->firstWhere('id', $activePhaseId) : null;

        $activities = $activePhase !== null
            ? $activePhase->activities()
                ->with(['author:id,name', 'reviewer:id,name', 'replies.author:id,name', 'attachment:id,name,size', 'resolvedBy:id,name'])
                ->get()
                ->map(fn (PhaseActivity $activity) => PhaseActivityPresenter::toArray($activity, $project))
            : [];

        $members = $project->members()->with('user:id,name,email')->get();

        $taggableMembers = collect([['id' => $project->owner->id, 'name' => $project->owner->name]])
            ->merge($members->map(fn ($member) => ['id' => $member->user->id, 'name' => $member->user->name]))
            ->unique('id')
            ->values();

        return Inertia::render('projects/show', [
            'project' => [
                ...$this->projectSummary($project, $user),
                'members' => $members->map(fn ($member) => [
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
            'phases' => $phases,
            'availablePhaseTemplates' => $availablePhaseTemplates,
            'activePhaseId' => $activePhase?->id,
            'activities' => $activities,
            'taggableMembers' => $taggableMembers,
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $project->fill($request->safe()->except('banner'));

        if ($request->hasFile('banner')) {
            if ($project->banner_path) {
                Storage::disk('public')->delete($project->banner_path);
            }

            $project->banner_path = $request->file('banner')->store('projects/banners', 'public');
        }

        $project->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return to_route('projects.show', $project);
    }

    public function destroy(Request $request, Project $project): RedirectResponse
    {
        Gate::authorize('delete', $project);

        foreach ($project->files as $file) {
            Storage::disk($file->disk)->delete($file->path);
        }

        if ($project->banner_path) {
            Storage::disk('public')->delete($project->banner_path);
        }

        $project->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project deleted.')]);

        return to_route('projects.index');
    }

    /**
     * @return array<string, mixed>
     */
    private function projectSummary(Project $project, User $user): array
    {
        return [
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'banner_url' => $project->banner_path ? Storage::disk('public')->url($project->banner_path) : null,
            'client_name' => $project->client_name,
            'client_email' => $project->client_email,
            'client_phone' => $project->client_phone,
            'site_address' => $project->site_address,
            'site_area' => $project->site_area,
            'latitude' => $project->latitude,
            'longitude' => $project->longitude,
            'start_date' => $project->start_date?->toDateString(),
            'end_date' => $project->end_date?->toDateString(),
            'status' => $project->status->value,
            'type' => $project->type?->value,
            'owner' => ['id' => $project->owner->id, 'name' => $project->owner->name],
            'role' => $project->roleValueFor($user),
            'can' => $project->abilitiesFor($user),
        ];
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
