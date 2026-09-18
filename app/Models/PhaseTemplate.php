<?php

namespace App\Models;

use Database\Factories\PhaseTemplateFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Carbon;

/**
 * A single step ("node") inside a PhaseFlowTemplate's canvas. Its one
 * outgoing connection is next_phase_template_id - there's no separate
 * edges table, see App\Support\PhaseFlowChain.
 *
 * @property int $id
 * @property int|null $phase_flow_template_id
 * @property int|null $next_phase_template_id
 * @property string $name
 * @property string|null $description
 * @property int $sort_order
 * @property int $position_x
 * @property int $position_y
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read PhaseFlowTemplate|null $flow
 * @property-read PhaseTemplate|null $next
 * @property-read PhaseTemplate|null $previous
 */
#[Fillable(['name', 'description', 'position_x', 'position_y'])]
class PhaseTemplate extends Model
{
    /** @use HasFactory<PhaseTemplateFactory> */
    use HasFactory;

    public function flow(): BelongsTo
    {
        return $this->belongsTo(PhaseFlowTemplate::class, 'phase_flow_template_id');
    }

    public function next(): BelongsTo
    {
        return $this->belongsTo(PhaseTemplate::class, 'next_phase_template_id');
    }

    public function previous(): HasOne
    {
        return $this->hasOne(PhaseTemplate::class, 'next_phase_template_id');
    }
}
