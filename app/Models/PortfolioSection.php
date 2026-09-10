<?php

namespace App\Models;

use App\Enums\PortfolioSectionType;
use Database\Factories\PortfolioSectionFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $portfolio_id
 * @property PortfolioSectionType $type
 * @property string|null $title
 * @property array{body?: string}|null $content
 * @property int $sort_order
 * @property bool $is_visible
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Portfolio $portfolio
 */
#[Fillable(['title', 'content', 'sort_order', 'is_visible'])]
class PortfolioSection extends Model
{
    /** @use HasFactory<PortfolioSectionFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'type' => PortfolioSectionType::class,
            'content' => 'array',
            'is_visible' => 'boolean',
        ];
    }

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
