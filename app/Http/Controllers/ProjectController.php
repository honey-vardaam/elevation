<?php

namespace App\Http\Controllers;

use App\Enums\ProjectActivityType;
use App\Http\Requests\Projects\StoreProjectRequest;
use App\Http\Requests\Projects\UpdateProjectRequest;
use App\Models\Folder;
use App\Models\PhaseActivity;
use App\Models\PhaseFlowTemplate;
use App\Models\PhaseTemplate;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\ProjectPhase;
use App\Models\Team;
use App\Models\User;
use App\Support\PhaseActivityPresenter;
use App\Support\ProjectFilePresenter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
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
            'teams' => $canCreate ? Team::summaries() : [],
            'phaseFlowTemplates' => PhaseFlowTemplate::query()
                ->with('steps')
                ->orderBy('name')
                ->get()
                ->filter(fn (PhaseFlowTemplate $flow) => $flow->isReady())
                ->values()
                ->map(fn (PhaseFlowTemplate $flow) => [
                    'id' => $flow->id,
                    'name' => $flow->name,
                    'description' => $flow->description,
                    'steps_count' => $flow->steps->count(),
                    'is_ready' => true,
                ]),
        ]);
    }

    public function store(StoreProjectRequest $request): RedirectResponse
    {
        $project = new Project($request->safe()->except(['banner', 'use_default_folders', 'members']));
        $project->owner_id = $request->user()->id;
        $project->save();

        ProjectActivity::log($project, ProjectActivityType::ProjectCreated, $request->user());

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

        if ($project->phase_flow_template_id) {
            $project->seedPhasesFromFlow($project->phaseFlowTemplate);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project created.')]);

        return to_route('projects.show', $project);
    }

    public function show(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $user = $request->user();
        $view = $request->query('view') === 'grid' ? 'grid' : 'list';
        $folderId = $request->query('folder') ? (int) $request->query('folder') : null;

        // One query for the whole tree - breadcrumbs/children are built in
        // memory instead of resolving ->parent recursively per request.
        $allFolders = $project->folders()->get(['id', 'parent_id', 'name']);
        $folderSizes = $this->folderSizes($project, $allFolders);

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

        // Both the grid and list views browse the same folder-scoped tree -
        // "view" only changes how the frontend renders the items, not which
        // items are fetched.
        $folders = $allFolders
            ->where('parent_id', $folderId)
            ->map(fn ($folder) => [
                'id' => $folder->id,
                'name' => $folder->name,
                'size' => $folderSizes[$folder->id] ?? 0,
            ])
            ->values();

        $files = $project->files()
            ->where('folder_id', $folderId)
            ->with('uploadedBy:id,name')
            ->latest()
            ->get()
            ->map(fn ($file) => $this->fileToArray($file, $project, $user));

        // Every file in the project, regardless of folder - lets the chat
        // composer attach something already in storage instead of always
        // uploading a fresh copy.
        $projectFiles = ProjectFilePresenter::forProject($project, $allFolders);

        $canManagePhases = $project->isManagedBy($user);

        $phaseModels = $project->phases()->with('team:id,name')->get();

        $phases = $phaseModels->map(fn (ProjectPhase $phase) => [
            'id' => $phase->id,
            'name' => $phase->name,
            'status' => $phase->status->value,
            'start_date' => $phase->start_date?->toDateString(),
            'end_date' => $phase->end_date?->toDateString(),
            'duration' => $phase->durationLabel(),
            'notes' => $phase->notes,
            'phase_template_id' => $phase->phase_template_id,
            'team' => $phase->team ? ['id' => $phase->team->id, 'name' => $phase->team->name] : null,
            'open_change_requests_count' => $phase->openChangeRequestsCount(),
            'change_requests_count' => $phase->changeRequestsCount(),
            'comments_count' => $phase->commentsCount(),
            'recent_activity' => $phase->recentActivity()->map(fn (PhaseActivity $activity) => [
                'id' => $activity->id,
                'type' => $activity->type->value,
                'preview' => PhaseActivityPresenter::preview($activity),
                'author' => ['id' => $activity->author->id, 'name' => $activity->author->name],
                'attachment_name' => $activity->attachment?->name,
                'created_at' => $activity->created_at->toIso8601String(),
            ]),
        ]);

        $availablePhaseTemplates = $canManagePhases && $project->phase_flow_template_id
            ? PhaseTemplate::query()
                ->where('phase_flow_template_id', $project->phase_flow_template_id)
                ->orderBy('sort_order')
                ->get()
                ->reject(fn (PhaseTemplate $template) => $phases->contains('phase_template_id', $template->id))
                ->values()
                ->map(fn (PhaseTemplate $template) => ['id' => $template->id, 'name' => $template->name])
            : [];

        $requestedPhaseId = $request->integer('phase');
        $currentPhase = $requestedPhaseId && $phaseModels->contains('id', $requestedPhaseId)
            ? $phaseModels->firstWhere('id', $requestedPhaseId)
            : ($project->currentPhase() ? $phaseModels->firstWhere('id', $project->currentPhase()->id) : null);

        $activities = $currentPhase !== null
            ? $currentPhase->activities()
                ->with(['author:id,name', 'reviewer:id,name', 'replies.author:id,name', 'attachment:id,name,size,mime_type', 'resolvedBy:id,name'])
                ->get()
                ->map(fn (PhaseActivity $activity) => PhaseActivityPresenter::toArray($activity, $project))
            : [];

        $nextPhaseName = $currentPhase !== null
            ? $project->phases()->where('sort_order', '>', $currentPhase->sort_order)->orderBy('sort_order')->value('name')
            : null;

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
            'teams' => $canManagePhases
                ? Team::query()->orderBy('name')->get(['id', 'name'])
                : [],
            'currentPhaseId' => $currentPhase?->id,
            'nextPhaseName' => $nextPhaseName,
            'activities' => $activities,
            'taggableMembers' => $taggableMembers,
            'projectFiles' => $projectFiles,
            'assignableUsers' => $project->isManagedBy($user)
                ? User::query()->orderBy('name')->get(['id', 'name', 'email'])
                : [],
        ]);
    }

    public function update(UpdateProjectRequest $request, Project $project): RedirectResponse
    {
        $previousStatus = $project->status;

        $project->fill($request->safe()->except(['banner', 'remove_banner']));

        if ($request->hasFile('banner')) {
            if ($project->banner_path) {
                Storage::disk('public')->delete($project->banner_path);
            }

            $project->banner_path = $request->file('banner')->store('projects/banners', 'public');
        } elseif ($request->boolean('remove_banner') && $project->banner_path) {
            Storage::disk('public')->delete($project->banner_path);
            $project->banner_path = null;
            $project->banner_focal_x = 50;
            $project->banner_focal_y = 50;
            $project->banner_zoom = 1;
        }

        $project->save();

        if ($project->status !== $previousStatus) {
            ProjectActivity::log($project, ProjectActivityType::ProjectStatusChanged, $request->user(), meta: [
                'from' => $previousStatus->value,
                'to' => $project->status->value,
            ]);
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Project updated.')]);

        return back();
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
     * Total bytes stored under each folder, including files nested inside
     * its subfolders - not just files placed directly in it.
     *
     * @param  Collection<int, Folder>  $allFolders
     * @return array<int, int>
     */
    private function folderSizes(Project $project, Collection $allFolders): array
    {
        $directSizeByFolder = $project->files()
            ->whereNotNull('folder_id')
            ->selectRaw('folder_id, sum(size) as total')
            ->groupBy('folder_id')
            ->pluck('total', 'folder_id');

        $childrenByParent = $allFolders->groupBy('parent_id');

        $totals = [];
        $totalFor = function (int $folderId) use (&$totalFor, &$totals, $childrenByParent, $directSizeByFolder) {
            if (isset($totals[$folderId])) {
                return $totals[$folderId];
            }

            $total = (int) ($directSizeByFolder[$folderId] ?? 0);

            foreach ($childrenByParent->get($folderId, collect()) as $child) {
                $total += $totalFor($child->id);
            }

            return $totals[$folderId] = $total;
        };

        foreach ($allFolders as $folder) {
            $totalFor($folder->id);
        }

        return $totals;
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
            'banner_focal_x' => $project->banner_focal_x,
            'banner_focal_y' => $project->banner_focal_y,
            'banner_zoom' => $project->banner_zoom,
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
    private function fileToArray(ProjectFile $file, Project $project, User $user): array
    {
        return [
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
    }
}
