<?php

namespace App\Models;

use App\Enums\ProjectPhaseStatus;
use App\Enums\ProjectRole;
use App\Enums\ProjectStatus;
use App\Enums\ProjectType;
use Database\Factories\ProjectFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property string|null $banner_path
 * @property float $banner_focal_x
 * @property float $banner_focal_y
 * @property float $banner_zoom
 * @property string|null $client_name
 * @property string|null $client_email
 * @property string|null $client_phone
 * @property string|null $site_address
 * @property float|null $site_area
 * @property float|null $latitude
 * @property float|null $longitude
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property ProjectStatus $status
 * @property ProjectType|null $type
 * @property int $owner_id
 * @property int|null $phase_flow_template_id
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User $owner
 * @property-read PhaseFlowTemplate|null $phaseFlowTemplate
 * @property-read Collection<int, ProjectMember> $members
 * @property-read Collection<int, Folder> $folders
 * @property-read Collection<int, ProjectFile> $files
 * @property-read Collection<int, ProjectPhase> $phases
 * @property-read Collection<int, ProjectActivity> $activities
 */
#[Fillable([
    'name',
    'description',
    'banner_focal_x',
    'banner_focal_y',
    'banner_zoom',
    'client_name',
    'client_email',
    'client_phone',
    'site_address',
    'site_area',
    'start_date',
    'end_date',
    'status',
    'type',
    'latitude',
    'longitude',
    'phase_flow_template_id',
])]
class Project extends Model
{
    /** @use HasFactory<ProjectFactory> */
    use HasFactory;

    /**
     * The starting set of default_folder_templates rows, seeded by the
     * create_default_folder_templates_table migration. Owners manage the
     * live list from Settings from there on - seedDefaultFolders() reads
     * DefaultFolderTemplate, not this constant.
     *
     * @var array<int, string>
     */
    public const array DEFAULT_FOLDER_NAMES = [
        'Site Specification',
        '3D Rendering',
        'Plan',
        'Elevation',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
            'status' => ProjectStatus::class,
            'type' => ProjectType::class,
            'site_area' => 'float',
            'latitude' => 'float',
            'longitude' => 'float',
            'banner_focal_x' => 'float',
            'banner_focal_y' => 'float',
            'banner_zoom' => 'float',
        ];
    }

    public function owner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function phaseFlowTemplate(): BelongsTo
    {
        return $this->belongsTo(PhaseFlowTemplate::class);
    }

    public function members(): HasMany
    {
        return $this->hasMany(ProjectMember::class);
    }

    public function folders(): HasMany
    {
        return $this->hasMany(Folder::class);
    }

    public function files(): HasMany
    {
        return $this->hasMany(ProjectFile::class);
    }

    public function phases(): HasMany
    {
        return $this->hasMany(ProjectPhase::class)->orderBy('sort_order');
    }

    public function activities(): HasMany
    {
        return $this->hasMany(ProjectActivity::class);
    }

    public function comparisons(): HasMany
    {
        return $this->hasMany(Comparison::class);
    }

    /**
     * The phase currently driving the project: the first in-progress phase,
     * else the first pending phase if the pipeline hasn't started yet, else
     * null once every phase is completed (or there are no phases at all).
     */
    public function currentPhase(): ?ProjectPhase
    {
        return $this->phases()->where('status', ProjectPhaseStatus::InProgress)->first()
            ?? $this->phases()->where('status', ProjectPhaseStatus::Pending)->first();
    }

    /**
     * Create the standard set of root-level folders for this project, from
     * the organization's configurable default-folder-structure settings.
     */
    public function seedDefaultFolders(User $creator): void
    {
        $names = DefaultFolderTemplate::orderBy('sort_order')->pluck('name');

        foreach ($names as $name) {
            $folder = new Folder(['name' => $name]);
            $folder->project_id = $this->id;
            $folder->parent_id = null;
            $folder->created_by = $creator->id;
            $folder->save();
        }
    }

    /**
     * Copy the firm's current phase pipeline onto this project as its own
     * trackable phases - later edits to the templates don't retroactively
     * change projects that already adopted the pipeline.
     */
    public function seedPhasesFromTemplates(): void
    {
        foreach (PhaseTemplate::orderBy('sort_order')->get() as $index => $template) {
            $phase = new ProjectPhase(['name' => $template->name]);
            $phase->project_id = $this->id;
            $phase->phase_template_id = $template->id;
            $phase->sort_order = $index;
            $phase->save();
        }
    }

    /**
     * Copy the given flow's steps onto this project as its own trackable
     * phases, in the flow's chain order - later edits to the flow don't
     * retroactively change projects that already adopted it. No-ops if the
     * flow isn't a single connected chain (the UI only ever offers ready
     * flows; this is a defensive fallback).
     */
    public function seedPhasesFromFlow(PhaseFlowTemplate $flow): void
    {
        $steps = $flow->orderedSteps();

        if ($steps === null) {
            return;
        }

        foreach ($steps->values() as $index => $step) {
            $phase = new ProjectPhase(['name' => $step->name]);
            $phase->project_id = $this->id;
            $phase->phase_template_id = $step->id;
            $phase->sort_order = $index;
            $phase->save();
        }
    }

    /**
     * Resolve the given user's access to this project: 'owner', a ProjectRole
     * for shared members, or null if they have no access at all.
     */
    public function roleFor(User $user): ProjectRole|string|null
    {
        if ($this->owner_id === $user->id) {
            return 'owner';
        }

        return $this->members()->where('user_id', $user->id)->first()?->role;
    }

    public function hasAccess(User $user): bool
    {
        return $this->roleFor($user) !== null;
    }

    public function isManagedBy(User $user): bool
    {
        $role = $this->roleFor($user);

        return $role === 'owner' || $role === ProjectRole::Manager;
    }

    public function isEditableBy(User $user): bool
    {
        $role = $this->roleFor($user);

        return $role === 'owner' || ($role instanceof ProjectRole && $role->canEdit());
    }

    /**
     * The user's role as a plain string ('owner', 'manager', 'editor',
     * 'viewer'), for serializing into Inertia props.
     */
    public function roleValueFor(User $user): ?string
    {
        $role = $this->roleFor($user);

        return $role instanceof ProjectRole ? $role->value : $role;
    }

    /**
     * The user's computed abilities on this project, for the frontend to
     * show/hide controls with. The server re-authorizes every mutation
     * independently - this map is UI sugar, not the source of truth.
     *
     * @return array<string, bool>
     */
    public function abilitiesFor(User $user): array
    {
        return [
            'update' => $this->isManagedBy($user),
            'delete' => $this->roleFor($user) === 'owner',
            'manageMembers' => $this->isManagedBy($user),
            'uploadFiles' => $this->isEditableBy($user),
            'createFolders' => $this->isEditableBy($user),
            'editItems' => $this->isEditableBy($user),
            'deleteItems' => $this->isManagedBy($user),
            'managePhases' => $this->isManagedBy($user),
        ];
    }
}
