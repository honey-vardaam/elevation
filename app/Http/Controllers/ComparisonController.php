<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comparisons\StoreComparisonRequest;
use App\Http\Requests\Comparisons\UpdateComparisonRequest;
use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class ComparisonController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $projectFilter = $request->query('project') ? (int) $request->query('project') : null;

        $comparisons = Comparison::query()
            ->visibleTo($user)
            ->when($projectFilter, fn ($query) => $query->where('project_id', $projectFilter))
            ->with(['project:id,name', 'creator:id,name', 'leftFile:id,name,mime_type', 'rightFile:id,name,mime_type'])
            ->latest('updated_at')
            ->get()
            ->map(fn (Comparison $comparison) => $this->summary($comparison));

        return Inertia::render('comparisons/index', [
            'comparisons' => $comparisons,
            'accessibleProjects' => $this->accessibleProjects($user),
            'projectFilter' => $projectFilter,
        ]);
    }

    /**
     * Also the entry point for "send to Smart Comparison" from a file
     * inside Project Collaboration - the file dropdown posts here with
     * left_file_id prefilled, and the workspace opens straight into
     * "pick a file to compare it with".
     */
    public function store(StoreComparisonRequest $request): RedirectResponse
    {
        $project = Project::findOrFail($request->validated('project_id'));
        $leftFileId = $request->validated('left_file_id');
        $leftFile = $leftFileId ? ProjectFile::find($leftFileId) : null;

        $comparison = new Comparison([
            'title' => $request->validated('title') ?: ($leftFile->name ?? 'New comparison'),
        ]);
        $comparison->project_id = $project->id;
        $comparison->created_by = $request->user()->id;
        $comparison->left_file_id = $leftFile?->id;
        $comparison->save();

        return to_route('comparisons.show', $comparison);
    }

    public function show(Request $request, Comparison $comparison): Response
    {
        Gate::authorize('view', $comparison);

        $comparison->load([
            'project:id,name,owner_id',
            'creator:id,name',
            'leftFile:id,project_id,folder_id,name,mime_type,size,uploaded_by,created_at',
            'leftFile.uploadedBy:id,name',
            'rightFile:id,project_id,folder_id,name,mime_type,size,uploaded_by,created_at',
            'rightFile.uploadedBy:id,name',
            'reviewers:id,name,email',
        ]);

        $annotations = $comparison->annotations()
            ->with('author:id,name', 'resolvedByUser:id,name')
            ->get();

        $otherFiles = ProjectFile::query()
            ->where('project_id', $comparison->project_id)
            ->whereNotIn('id', array_filter([$comparison->left_file_id, $comparison->right_file_id]))
            ->with('uploadedBy:id,name')
            ->latest()
            ->get()
            ->map(fn (ProjectFile $file) => $this->fileSummary($file));

        $canManage = Gate::allows('update', $comparison);

        return Inertia::render('comparisons/show', [
            'comparison' => [
                'id' => $comparison->id,
                'title' => $comparison->title,
                'mode' => $comparison->mode->value,
                'project' => ['id' => $comparison->project->id, 'name' => $comparison->project->name],
                'creator' => ['id' => $comparison->creator->id, 'name' => $comparison->creator->name],
                'created_at' => $comparison->created_at->toIso8601String(),
                'is_complete' => $comparison->isComplete(),
                'is_previewable' => $comparison->isPreviewable(),
                'is_overlayable' => $comparison->isOverlayable(),
            ],
            'leftFile' => $comparison->leftFile ? $this->fileSummary($comparison->leftFile) : null,
            'rightFile' => $comparison->rightFile ? $this->fileSummary($comparison->rightFile) : null,
            'otherFiles' => $otherFiles,
            'annotations' => $this->annotationTree($annotations),
            'reviewers' => $comparison->reviewers->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]),
            'can' => [
                'update' => $canManage,
                'delete' => Gate::allows('delete', $comparison),
                'manageReviewers' => Gate::allows('manageReviewers', $comparison),
            ],
            'elevationUsers' => $canManage
                ? User::query()->orderBy('name')->get(['id', 'name', 'email'])
                : [],
        ]);
    }

    public function update(UpdateComparisonRequest $request, Comparison $comparison): RedirectResponse
    {
        $comparison->fill($request->safe()->only('title', 'mode'));

        if ($request->has('left_file_id')) {
            $comparison->left_file_id = $request->validated('left_file_id');
        }

        if ($request->has('right_file_id')) {
            $comparison->right_file_id = $request->validated('right_file_id');
        }

        $comparison->save();

        return back();
    }

    public function destroy(Request $request, Comparison $comparison): RedirectResponse
    {
        Gate::authorize('delete', $comparison);

        $comparison->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Comparison deleted.')]);

        return to_route('comparisons.index');
    }

    /**
     * Invite an Elevation user (project member or not) as a reviewer -
     * the "share a completed comparison for review" action. Grants view +
     * comment access; nothing more (no notification/email yet - see the
     * module's collaboration-integration roadmap).
     */
    public function storeReviewer(Request $request, Comparison $comparison): RedirectResponse
    {
        Gate::authorize('manageReviewers', $comparison);

        $data = $request->validate([
            'user_id' => ['required', 'integer', 'exists:users,id'],
        ]);

        $comparison->reviewers()->syncWithoutDetaching([
            $data['user_id'] => ['invited_by' => $request->user()->id, 'created_at' => now()],
        ]);

        return back();
    }

    public function destroyReviewer(Request $request, Comparison $comparison, User $reviewer): RedirectResponse
    {
        Gate::authorize('manageReviewers', $comparison);

        $comparison->reviewers()->detach($reviewer->id);

        return back();
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Comparison $comparison): array
    {
        return [
            'id' => $comparison->id,
            'title' => $comparison->title,
            'mode' => $comparison->mode->value,
            'project' => ['id' => $comparison->project->id, 'name' => $comparison->project->name],
            'creator' => ['id' => $comparison->creator->id, 'name' => $comparison->creator->name],
            'left_file' => $comparison->leftFile ? ['id' => $comparison->leftFile->id, 'name' => $comparison->leftFile->name, 'mime_type' => $comparison->leftFile->mime_type] : null,
            'right_file' => $comparison->rightFile ? ['id' => $comparison->rightFile->id, 'name' => $comparison->rightFile->name, 'mime_type' => $comparison->rightFile->mime_type] : null,
            'is_complete' => $comparison->isComplete(),
            'updated_at' => $comparison->updated_at->toIso8601String(),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function fileSummary(ProjectFile $file): array
    {
        return [
            'id' => $file->id,
            'name' => $file->name,
            'mime_type' => $file->mime_type,
            'size' => $file->size,
            'uploaded_by' => ['id' => $file->uploadedBy->id, 'name' => $file->uploadedBy->name],
            'created_at' => $file->created_at->toIso8601String(),
            'view_url' => route('projects.files.view', [$file->project_id, $file->id]),
            'download_url' => route('projects.files.download', [$file->project_id, $file->id]),
            'is_image' => Str::startsWith((string) $file->mime_type, 'image/'),
            'is_pdf' => $file->mime_type === 'application/pdf',
        ];
    }

    /**
     * Top-level annotations with their replies nested underneath, newest
     * top-level thread last (matches how the phase timeline orders
     * comments) - resolved pins stay in place rather than being filtered
     * out, so the thread history is never lost.
     *
     * @param  \Illuminate\Support\Collection<int, ComparisonAnnotation>  $annotations
     * @return array<int, array<string, mixed>>
     */
    private function annotationTree($annotations): array
    {
        $byParent = $annotations->groupBy('parent_id');

        $toArray = function (ComparisonAnnotation $annotation) use ($byParent, &$toArray) {
            return [
                'id' => $annotation->id,
                'side' => $annotation->side->value,
                'x' => $annotation->x,
                'y' => $annotation->y,
                'body' => $annotation->body,
                'author' => ['id' => $annotation->author->id, 'name' => $annotation->author->name],
                'resolved_at' => $annotation->resolved_at?->toIso8601String(),
                'resolved_by' => $annotation->resolvedByUser ? ['id' => $annotation->resolvedByUser->id, 'name' => $annotation->resolvedByUser->name] : null,
                'created_at' => $annotation->created_at->toIso8601String(),
                'replies' => ($byParent->get($annotation->id) ?? collect())
                    ->sortBy('created_at')
                    ->map($toArray)
                    ->values()
                    ->all(),
            ];
        };

        return $byParent->get(null, collect())
            ->sortBy('created_at')
            ->map($toArray)
            ->values()
            ->all();
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function accessibleProjects(User $user): array
    {
        return Project::query()
            ->where(fn ($query) => $query
                ->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($members) => $members->where('user_id', $user->id)))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $project) => ['id' => $project->id, 'name' => $project->name])
            ->all();
    }
}
