<?php

namespace App\Models;

use Database\Factories\PortfolioTestimonialFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $portfolio_id
 * @property string $author_name
 * @property string|null $author_role
 * @property string $quote
 * @property string|null $photo_path
 * @property int $sort_order
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Portfolio $portfolio
 */
#[Fillable(['author_name', 'author_role', 'quote', 'sort_order'])]
class PortfolioTestimonial extends Model
{
    /** @use HasFactory<PortfolioTestimonialFactory> */
    use HasFactory;

    public function portfolio(): BelongsTo
    {
        return $this->belongsTo(Portfolio::class);
    }
}
