<?php

namespace App\Models;

use App\Support\PhaseFlowChain;
use Database\Factories\PhaseFlowTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $name
 * @property string|null $description
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, PhaseTemplate> $steps
 * @property-read Collection<int, Project> $projects
 */
#[Fillable(['name', 'description'])]
class PhaseFlowTemplate extends Model
{
    /** @use HasFactory<PhaseFlowTemplateFactory> */
    use HasFactory;

    public function steps(): HasMany
    {
        return $this->hasMany(PhaseTemplate::class);
    }

    public function projects(): HasMany
    {
        return $this->hasMany(Project::class);
    }

    /**
     * This flow's steps walked from start to end, or null when the steps
     * don't currently form exactly one connected, acyclic chain (e.g. a
     * step hasn't been connected yet). Reads from the `steps` relation, so
     * eager-load it (`with('steps')`) to avoid a query per flow.
     *
     * @return Collection<int, PhaseTemplate>|null
     */
    public function orderedSteps(): ?Collection
    {
        return PhaseFlowChain::walk($this->steps);
    }

    /**
     * Whether this flow has at least one step and all of its steps form a
     * single chain - only flows in this state can be applied to a project.
     */
    public function isReady(): bool
    {
        return $this->steps->isNotEmpty() && $this->orderedSteps() !== null;
    }
}
