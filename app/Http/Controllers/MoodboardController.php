<?php

namespace App\Http\Controllers;

use App\Enums\MoodboardElementType;
use App\Http\Requests\Moodboards\StoreMoodboardRequest;
use App\Http\Requests\Moodboards\SyncMoodboardCanvasRequest;
use App\Models\Moodboard;
use App\Models\MoodboardElement;
use App\Models\Project;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class MoodboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();
        $projectFilter = $request->query('project') ? (int) $request->query('project') : null;

        $moodboards = Moodboard::query()
            ->visibleTo($user)
            ->when($projectFilter, fn ($query) => $query->where('project_id', $projectFilter))
            ->with(['project:id,name,owner_id', 'user:id,name', 'elements'])
            ->latest('updated_at')
            ->get()
            ->map(fn (Moodboard $moodboard) => $this->summary($moodboard, $user));

        return Inertia::render('moodboards/index', [
            'moodboards' => $moodboards,
            'manageableProjects' => $this->manageableProjects($user),
            'projectFilter' => $projectFilter,
        ]);
    }

    public function store(StoreMoodboardRequest $request): RedirectResponse
    {
        $moodboard = new Moodboard(['title' => $request->validated('title')]);
        $moodboard->user_id = $request->user()->id;
        $moodboard->project_id = $request->validated('project_id');
        $moodboard->save();

        return to_route('moodboards.show', $moodboard);
    }

    public function show(Request $request, Moodboard $moodboard): Response
    {
        Gate::authorize('view', $moodboard);

        // Load project and its members so the share dialog can display access & team members
        $moodboard->load([
            'project:id,name,owner_id',
            'project.owner:id,name,email',
            'project.members.user:id,name,email',
            'elements',
        ]);

        return Inertia::render('moodboards/show', [
            'moodboard' => [
                'id' => $moodboard->id,
                'title' => $moodboard->title,
                'project' => $moodboard->project ? [
                    'id' => $moodboard->project->id,
                    'name' => $moodboard->project->name,
                    'owner' => $moodboard->project->owner ? [
                        'id' => $moodboard->project->owner->id,
                        'name' => $moodboard->project->owner->name,
                        'email' => $moodboard->project->owner->email,
                    ] : null,
                    'members' => $moodboard->project->members->map(fn ($m) => [
                        'id' => $m->id,
                        'role' => $m->role->value,
                        'user' => [
                            'id' => $m->user->id,
                            'name' => $m->user->name,
                            'email' => $m->user->email,
                        ],
                    ]),
                ] : null,
            ],
            'manageableProjects' => $this->manageableProjects($request->user()),
            'elements' => $moodboard->elements
                ->sortBy('z_index')
                ->values()
                ->map(fn (MoodboardElement $element) => $element->toCanvasArray()),
            'can' => [
                'update' => Gate::allows('update', $moodboard),
                'delete' => Gate::allows('delete', $moodboard),
            ],
        ]);
    }

    public function update(Request $request, Moodboard $moodboard): RedirectResponse
    {
        Gate::authorize('update', $moodboard);

        $validated = $request->validate([
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'project_id' => ['sometimes', 'nullable', 'exists:projects,id'],
        ]);

        $moodboard->fill($validated);
        $moodboard->save();

        return back();
    }

    public function destroy(Request $request, Moodboard $moodboard): RedirectResponse
    {
        Gate::authorize('delete', $moodboard);

        Storage::disk('public')->deleteDirectory($this->imageDirectory($moodboard));
        $moodboard->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Moodboard deleted.')]);

        return to_route('moodboards.index');
    }

    /**
     * Replace the whole board with the client's copy. The canvas edits
     * locally and autosaves the full element list, so this is a diff:
     * missing elements are deleted, the rest are upserted.
     */
    public function syncCanvas(SyncMoodboardCanvasRequest $request, Moodboard $moodboard): JsonResponse
    {
        $incoming = collect($request->validated('elements'));
        $imagePrefix = $this->imageDirectory($moodboard).'/';

        $foreignIds = MoodboardElement::query()
            ->whereIn('id', $incoming->pluck('id'))
            ->where('moodboard_id', '!=', $moodboard->id)
            ->exists();

        if ($foreignIds) {
            throw ValidationException::withMessages(['elements' => 'One or more elements belong to another board.']);
        }

        $rows = $incoming->map(function (array $element) use ($moodboard, $imagePrefix) {
            $type = MoodboardElementType::from($element['type']);

            return [
                'id' => $element['id'],
                'moodboard_id' => $moodboard->id,
                'type' => $type->value,
                'x' => $element['x'],
                'y' => $element['y'],
                'width' => $element['width'] ?? null,
                'height' => $element['height'] ?? null,
                'z_index' => $element['z_index'],
                'data' => json_encode($this->normalizeData($type, $element['data'] ?? [], $imagePrefix)),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        });

        DB::transaction(function () use ($moodboard, $rows) {
            $removed = $moodboard->elements()->whereNotIn('id', $rows->pluck('id'))->get();

            $removedImages = $removed
                ->filter(fn (MoodboardElement $element) => $element->type === MoodboardElementType::Image)
                ->map(fn (MoodboardElement $element) => $element->data['path'] ?? null)
                ->filter()
                ->all();

            $moodboard->elements()->whereIn('id', $removed->pluck('id'))->delete();

            if ($rows->isNotEmpty()) {
                MoodboardElement::upsert(
                    $rows->all(),
                    ['id'],
                    ['type', 'x', 'y', 'width', 'height', 'z_index', 'data', 'updated_at'],
                );
            }

            if ($removedImages !== []) {
                Storage::disk('public')->delete($removedImages);
            }

            $moodboard->touch();
        });

        return response()->json(['saved_at' => now()->toIso8601String()]);
    }

    public function uploadImage(Request $request, Moodboard $moodboard): JsonResponse
    {
        Gate::authorize('update', $moodboard);

        $request->validate([
            'image' => ['required', 'image', 'max:10240'],
        ]);

        $path = $request->file('image')->store($this->imageDirectory($moodboard), 'public');

        return response()->json([
            'path' => $path,
            'url' => Storage::disk('public')->url($path),
        ]);
    }

    /**
     * Keep only the keys each element type actually uses, so the stored
     * JSON can't grow arbitrary payloads, and pin image paths to this
     * board's own upload directory.
     *
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalizeData(MoodboardElementType $type, array $data, string $imagePrefix): array
    {
        return match ($type) {
            MoodboardElementType::Checklist => [
                'title' => $data['title'] ?? '',
                'color' => $data['color'] ?? null,
                'items' => collect($data['items'] ?? [])
                    ->map(fn (array $item) => [
                        'id' => (string) $item['id'],
                        'text' => (string) ($item['text'] ?? ''),
                        'done' => (bool) $item['done'],
                    ])
                    ->values()
                    ->all(),
            ],
            MoodboardElementType::Note => Arr::only($data, ['text', 'color']),
            MoodboardElementType::Text => Arr::only($data, ['text', 'size']),
            MoodboardElementType::Image => isset($data['path']) && Str::startsWith($data['path'], $imagePrefix) && ! Str::contains($data['path'], '..')
                ? ['path' => $data['path']]
                : [],
            MoodboardElementType::Sticker => Arr::only($data, ['emoji', 'label', 'color']),
            MoodboardElementType::Section => Arr::only($data, ['title', 'color']),
        };
    }

    private function imageDirectory(Moodboard $moodboard): string
    {
        return 'moodboards/'.$moodboard->id;
    }

    /**
     * @return array<string, mixed>
     */
    private function summary(Moodboard $moodboard, User $user): array
    {
        $counts = $moodboard->itemCounts();
        $cover = $moodboard->elements->first(
            fn (MoodboardElement $element) => $element->type === MoodboardElementType::Image && isset($element->data['path'])
        );

        return [
            'id' => $moodboard->id,
            'title' => $moodboard->title,
            'project' => $moodboard->project ? ['id' => $moodboard->project->id, 'name' => $moodboard->project->name] : null,
            'owner' => ['id' => $moodboard->user->id, 'name' => $moodboard->user->name],
            'items_total' => $counts['total'],
            'items_done' => $counts['done'],
            'elements_count' => $moodboard->elements->count(),
            'cover_url' => $cover ? Storage::disk('public')->url($cover->data['path']) : null,
            'updated_at' => $moodboard->updated_at->toIso8601String(),
            'can' => ['update' => Gate::forUser($user)->allows('update', $moodboard)],
        ];
    }

    /**
     * @return array<int, array{id: int, name: string}>
     */
    private function manageableProjects(User $user): array
    {
        return Project::query()
            ->where(fn ($query) => $query
                ->where('owner_id', $user->id)
                ->orWhereHas('members', fn ($members) => $members->where('user_id', $user->id)->where('role', 'manager')))
            ->orderBy('name')
            ->get(['id', 'name'])
            ->map(fn (Project $project) => ['id' => $project->id, 'name' => $project->name])
            ->all();
    }
}
