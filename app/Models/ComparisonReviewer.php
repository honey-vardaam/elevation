<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Relations\Pivot;

class ComparisonReviewer extends Pivot
{
    public $incrementing = true;

    public $timestamps = false;

    protected $table = 'comparison_reviewers';

    /**
     * Pivot::fromRawAttributes() re-enables $timestamps based on whether
     * "created_at" is present in the attributes being attached, regardless
     * of the property above - returning null here opts fully out of that
     * detection so the single manual `created_at` column (no `updated_at`)
     * is never fought over.
     */
    public function getCreatedAtColumn(): ?string
    {
        return null;
    }

    public function getUpdatedAtColumn(): ?string
    {
        return null;
    }
}
