<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\Portfolio;
use App\Models\PortfolioSection;
use App\Models\Project;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class PublicPortfolioController extends Controller
{
    public function show(Portfolio $portfolio): Response
    {
        abort_unless($portfolio->is_published, 404);

        $company = Company::current();
        $heroUrl = $portfolio->hero_image_path ? Storage::disk('public')->url($portfolio->hero_image_path) : null;

        return Inertia::render('portfolios/public', [
            'portfolio' => [
                'year' => $portfolio->year,
                'title' => $portfolio->title,
                'intro' => $portfolio->intro,
                'hero_url' => $heroUrl,
                'share_url' => route('portfolio.public', $portfolio->share_slug),
            ],
            'sections' => $portfolio->sections
                ->where('is_visible', true)
                ->map(fn (PortfolioSection $section) => [
                    'id' => $section->id,
                    'type' => $section->type->value,
                    'title' => $section->title,
                    'body' => $section->content['body'] ?? null,
                ])
                ->values(),
            'stats' => [
                'completed_count' => $portfolio->completedProjects()->count(),
                'ongoing_count' => $portfolio->ongoingProjectsCount(),
                'sqft_covered' => $portfolio->sqftCovered(),
                'type_breakdown' => $portfolio->typeBreakdown(),
            ],
            'pins' => $portfolio->pinnedProjects()
                ->map(fn (Project $project) => [
                    'id' => $project->id,
                    'name' => $project->name,
                    'type' => $project->type?->value,
                    'latitude' => $project->latitude,
                    'longitude' => $project->longitude,
                ])
                ->values(),
            'photos' => $portfolio->photos->map(fn ($photo) => [
                'id' => $photo->id,
                'url' => Storage::disk('public')->url($photo->path),
                'caption' => $photo->caption,
            ]),
            'testimonials' => $portfolio->testimonials->map(fn ($testimonial) => [
                'id' => $testimonial->id,
                'author_name' => $testimonial->author_name,
                'author_role' => $testimonial->author_role,
                'quote' => $testimonial->quote,
                'photo_url' => $testimonial->photo_path ? Storage::disk('public')->url($testimonial->photo_path) : null,
            ]),
            'company' => [
                'name' => $company->name,
                'logo_url' => $company->logo_path ? Storage::disk('public')->url($company->logo_path) : null,
                'address' => $company->address,
                'phone' => $company->phone,
                'email' => $company->email,
                'website' => $company->website,
                'about' => $company->about,
            ],
            'meta' => [
                'title' => $portfolio->title ?? "{$portfolio->year} Portfolio",
                'description' => $portfolio->intro ?? ($company->name ? "See {$company->name}'s {$portfolio->year} work." : "Portfolio for {$portfolio->year}."),
                'image' => $heroUrl,
            ],
        ]);
    }
}
