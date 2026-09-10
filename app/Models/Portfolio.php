<?php

namespace App\Models;

use App\Enums\ProjectStatus;
use Database\Factories\PortfolioFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property int $year
 * @property string|null $title
 * @property string|null $hero_image_path
 * @property string|null $intro
 * @property string $share_slug
 * @property bool $is_published
 * @property int|null $created_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Collection<int, PortfolioSection> $sections
 * @property-read Collection<int, PortfolioPhoto> $photos
 * @property-read Collection<int, PortfolioTestimonial> $testimonials
 */
#[Fillable(['year', 'title', 'intro', 'is_published'])]
class Portfolio extends Model
{
    /** @use HasFactory<PortfolioFactory> */
    use HasFactory;

    protected function casts(): array
    {
        return [
            'is_published' => 'boolean',
        ];
    }

    public function sections(): HasMany
    {
        return $this->hasMany(PortfolioSection::class)->orderBy('sort_order');
    }

    public function photos(): HasMany
    {
        return $this->hasMany(PortfolioPhoto::class)->orderBy('sort_order');
    }

    public function testimonials(): HasMany
    {
        return $this->hasMany(PortfolioTestimonial::class)->orderBy('sort_order');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * A unique, URL-safe slug for the public share link, derived from the
     * year and the firm's name at creation time (deliberately not
     * regenerated later - changing it would break already-shared links).
     */
    public static function generateSlug(int $year): string
    {
        $companyName = Company::current()->name;
        $base = Str::slug($companyName ? "{$companyName}-{$year}" : "portfolio-{$year}");

        $slug = $base;
        $suffix = 1;

        while (self::where('share_slug', $slug)->exists()) {
            $suffix++;
            $slug = "{$base}-{$suffix}";
        }

        return $slug;
    }

    /**
     * Projects completed within this portfolio's year - the source for the
     * map pins, type breakdown, and sqft total.
     *
     * @return Collection<int, Project>
     */
    public function completedProjects(): Collection
    {
        return Project::query()
            ->where('status', ProjectStatus::Completed)
            ->whereNotNull('end_date')
            ->whereYear('end_date', $this->year)
            ->get();
    }

    /**
     * Currently ongoing projects, firm-wide - a live figure, not scoped to
     * this portfolio's year.
     */
    public function ongoingProjectsCount(): int
    {
        return Project::query()->where('status', ProjectStatus::Ongoing)->count();
    }

    public function sqftCovered(): float
    {
        return (float) $this->completedProjects()->sum('site_area');
    }

    /**
     * Completed-project counts grouped by type, for the stats breakdown.
     *
     * @return array<string, int>
     */
    public function typeBreakdown(): array
    {
        return $this->completedProjects()
            ->groupBy(fn (Project $project) => $project->type?->value ?? 'uncategorized')
            ->map(fn (Collection $group) => $group->count())
            ->all();
    }

    /**
     * Completed projects that have a map pin, for the portfolio map.
     *
     * @return Collection<int, Project>
     */
    public function pinnedProjects(): Collection
    {
        return $this->completedProjects()
            ->filter(fn (Project $project) => $project->latitude !== null && $project->longitude !== null)
            ->values();
    }
}
