<?php

namespace App\Http\Controllers;

use App\Enums\PortfolioSectionType;
use App\Http\Requests\Portfolios\StorePortfolioRequest;
use App\Http\Requests\Portfolios\UpdatePortfolioRequest;
use App\Models\Company;
use App\Models\Portfolio;
use App\Models\PortfolioSection;
use App\Models\Project;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PortfolioController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Portfolio::class);

        $portfolios = Portfolio::query()
            ->withCount(['photos', 'testimonials'])
            ->orderByDesc('year')
            ->get()
            ->map(fn (Portfolio $portfolio) => [
                'id' => $portfolio->id,
                'year' => $portfolio->year,
                'title' => $portfolio->title,
                'hero_url' => $portfolio->hero_image_path ? Storage::disk('public')->url($portfolio->hero_image_path) : null,
                'is_published' => $portfolio->is_published,
                'share_url' => $portfolio->is_published ? route('portfolio.public', $portfolio->share_slug) : null,
                'photos_count' => $portfolio->photos_count,
                'testimonials_count' => $portfolio->testimonials_count,
                'completed_count' => $portfolio->completedProjects()->count(),
            ]);

        return Inertia::render('portfolios/index', [
            'portfolios' => $portfolios,
            'availableYears' => $this->availableYears(),
        ]);
    }

    public function store(StorePortfolioRequest $request): RedirectResponse
    {
        $year = (int) $request->validated('year');

        $portfolio = new Portfolio(['year' => $year, 'title' => "{$year} Portfolio"]);
        $portfolio->share_slug = Portfolio::generateSlug($year);
        $portfolio->created_by = $request->user()->id;
        $portfolio->save();

        foreach (PortfolioSectionType::defaults() as $index => $type) {
            $section = new PortfolioSection(['sort_order' => $index]);
            $section->portfolio_id = $portfolio->id;
            $section->type = $type;
            $section->save();
        }

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Portfolio created.')]);

        return to_route('portfolios.show', $portfolio);
    }

    public function show(Portfolio $portfolio): Response
    {
        Gate::authorize('update', $portfolio);

        return Inertia::render('portfolios/show', [
            'portfolio' => $this->toArray($portfolio),
            'sections' => $portfolio->sections->map(fn (PortfolioSection $section) => [
                'id' => $section->id,
                'type' => $section->type->value,
                'label' => $section->type->label(),
                'title' => $section->title,
                'body' => $section->content['body'] ?? null,
                'sort_order' => $section->sort_order,
                'is_visible' => $section->is_visible,
                'is_deletable' => $section->type->isDeletable(),
            ]),
            'photos' => $portfolio->photos->map(fn ($photo) => [
                'id' => $photo->id,
                'url' => Storage::disk('public')->url($photo->path),
                'caption' => $photo->caption,
                'sort_order' => $photo->sort_order,
            ]),
            'testimonials' => $portfolio->testimonials->map(fn ($testimonial) => [
                'id' => $testimonial->id,
                'author_name' => $testimonial->author_name,
                'author_role' => $testimonial->author_role,
                'quote' => $testimonial->quote,
                'photo_url' => $testimonial->photo_path ? Storage::disk('public')->url($testimonial->photo_path) : null,
            ]),
            'stats' => $this->statsFor($portfolio),
            'pins' => $this->pinsFor($portfolio),
            'company' => $this->companyArray(),
        ]);
    }

    public function update(UpdatePortfolioRequest $request, Portfolio $portfolio): RedirectResponse
    {
        $portfolio->fill($request->safe()->except('hero_image'));

        if ($request->hasFile('hero_image')) {
            if ($portfolio->hero_image_path) {
                Storage::disk('public')->delete($portfolio->hero_image_path);
            }

            $portfolio->hero_image_path = $request->file('hero_image')->store('portfolios/hero', 'public');
        }

        $portfolio->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Portfolio updated.')]);

        return to_route('portfolios.show', $portfolio);
    }

    public function destroy(Portfolio $portfolio): RedirectResponse
    {
        Gate::authorize('delete', $portfolio);

        if ($portfolio->hero_image_path) {
            Storage::disk('public')->delete($portfolio->hero_image_path);
        }

        foreach ($portfolio->photos as $photo) {
            Storage::disk('public')->delete($photo->path);
        }

        foreach ($portfolio->testimonials as $testimonial) {
            if ($testimonial->photo_path) {
                Storage::disk('public')->delete($testimonial->photo_path);
            }
        }

        $portfolio->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Portfolio deleted.')]);

        return to_route('portfolios.index');
    }

    /**
     * @return array<int, int>
     */
    private function availableYears(): array
    {
        $taken = Portfolio::query()->pluck('year')->all();
        $nextYear = (int) now()->format('Y') + 1;

        $candidates = range($nextYear, $nextYear - 15);

        return array_values(array_diff($candidates, $taken));
    }

    /**
     * @return array<string, mixed>
     */
    private function toArray(Portfolio $portfolio): array
    {
        return [
            'id' => $portfolio->id,
            'year' => $portfolio->year,
            'title' => $portfolio->title,
            'intro' => $portfolio->intro,
            'hero_url' => $portfolio->hero_image_path ? Storage::disk('public')->url($portfolio->hero_image_path) : null,
            'is_published' => $portfolio->is_published,
            'share_slug' => $portfolio->share_slug,
            'share_url' => route('portfolio.public', $portfolio->share_slug),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function statsFor(Portfolio $portfolio): array
    {
        return [
            'completed_count' => $portfolio->completedProjects()->count(),
            'ongoing_count' => $portfolio->ongoingProjectsCount(),
            'sqft_covered' => $portfolio->sqftCovered(),
            'type_breakdown' => $portfolio->typeBreakdown(),
        ];
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    private function pinsFor(Portfolio $portfolio): array
    {
        return $portfolio->pinnedProjects()
            ->map(fn (Project $project) => [
                'id' => $project->id,
                'name' => $project->name,
                'type' => $project->type?->value,
                'latitude' => $project->latitude,
                'longitude' => $project->longitude,
            ])
            ->values()
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function companyArray(): array
    {
        $company = Company::current();

        return [
            'name' => $company->name,
            'logo_url' => $company->logo_path ? Storage::disk('public')->url($company->logo_path) : null,
            'address' => $company->address,
            'phone' => $company->phone,
            'email' => $company->email,
            'website' => $company->website,
            'about' => $company->about,
        ];
    }
}
