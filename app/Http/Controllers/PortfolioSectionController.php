<?php

namespace App\Http\Controllers;

use App\Enums\PortfolioSectionType;
use App\Http\Requests\Portfolios\StorePortfolioSectionRequest;
use App\Http\Requests\Portfolios\UpdatePortfolioSectionRequest;
use App\Models\Portfolio;
use App\Models\PortfolioSection;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;

class PortfolioSectionController extends Controller
{
    public function store(StorePortfolioSectionRequest $request, Portfolio $portfolio): RedirectResponse
    {
        $section = new PortfolioSection([
            'title' => $request->validated('title'),
            'content' => ['body' => $request->validated('body')],
            'sort_order' => ((int) $portfolio->sections()->max('sort_order')) + 1,
        ]);
        $section->portfolio_id = $portfolio->id;
        $section->type = PortfolioSectionType::CustomText;
        $section->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Section added.')]);

        return back();
    }

    public function update(UpdatePortfolioSectionRequest $request, Portfolio $portfolio, PortfolioSection $section): RedirectResponse
    {
        $section->title = $request->validated('title');
        $section->is_visible = $request->boolean('is_visible');

        if ($section->type === PortfolioSectionType::CustomText) {
            $section->content = ['body' => $request->validated('body')];
        }

        $section->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Section updated.')]);

        return back();
    }

    public function reorder(Request $request, Portfolio $portfolio): RedirectResponse
    {
        Gate::authorize('update', $portfolio);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:portfolio_sections,id'],
        ])['ids'];

        foreach ($ids as $index => $id) {
            PortfolioSection::where('id', $id)
                ->where('portfolio_id', $portfolio->id)
                ->update(['sort_order' => $index]);
        }

        return back();
    }

    public function destroy(Portfolio $portfolio, PortfolioSection $section): RedirectResponse
    {
        Gate::authorize('update', $portfolio);

        abort_unless($section->type->isDeletable(), 403, 'Built-in sections can only be hidden, not deleted.');

        $section->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Section removed.')]);

        return back();
    }
}
