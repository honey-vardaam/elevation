<?php

namespace App\Http\Controllers;

use App\Http\Requests\Portfolios\StorePortfolioTestimonialRequest;
use App\Http\Requests\Portfolios\UpdatePortfolioTestimonialRequest;
use App\Models\Portfolio;
use App\Models\PortfolioTestimonial;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PortfolioTestimonialController extends Controller
{
    public function store(StorePortfolioTestimonialRequest $request, Portfolio $portfolio): RedirectResponse
    {
        $testimonial = new PortfolioTestimonial([
            'author_name' => $request->validated('author_name'),
            'author_role' => $request->validated('author_role'),
            'quote' => $request->validated('quote'),
            'sort_order' => ((int) $portfolio->testimonials()->max('sort_order')) + 1,
        ]);
        $testimonial->portfolio_id = $portfolio->id;

        if ($request->hasFile('photo')) {
            $testimonial->photo_path = $request->file('photo')->store('portfolios/testimonials', 'public');
        }

        $testimonial->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Testimonial added.')]);

        return back();
    }

    public function update(UpdatePortfolioTestimonialRequest $request, Portfolio $portfolio, PortfolioTestimonial $testimonial): RedirectResponse
    {
        $testimonial->fill($request->safe()->only('author_name', 'author_role', 'quote'));

        if ($request->hasFile('photo')) {
            if ($testimonial->photo_path) {
                Storage::disk('public')->delete($testimonial->photo_path);
            }

            $testimonial->photo_path = $request->file('photo')->store('portfolios/testimonials', 'public');
        }

        $testimonial->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Testimonial updated.')]);

        return back();
    }

    public function destroy(Portfolio $portfolio, PortfolioTestimonial $testimonial): RedirectResponse
    {
        Gate::authorize('update', $portfolio);

        if ($testimonial->photo_path) {
            Storage::disk('public')->delete($testimonial->photo_path);
        }

        $testimonial->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Testimonial removed.')]);

        return back();
    }
}
