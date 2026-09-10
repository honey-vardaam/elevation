<?php

namespace App\Http\Controllers;

use App\Http\Requests\Portfolios\StorePortfolioPhotoRequest;
use App\Models\Portfolio;
use App\Models\PortfolioPhoto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class PortfolioPhotoController extends Controller
{
    public function store(StorePortfolioPhotoRequest $request, Portfolio $portfolio): RedirectResponse
    {
        $photo = new PortfolioPhoto([
            'caption' => $request->validated('caption'),
            'sort_order' => ((int) $portfolio->photos()->max('sort_order')) + 1,
        ]);
        $photo->portfolio_id = $portfolio->id;
        $photo->path = $request->file('photo')->store('portfolios/gallery', 'public');
        $photo->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Photo added.')]);

        return back();
    }

    public function reorder(Request $request, Portfolio $portfolio): RedirectResponse
    {
        Gate::authorize('update', $portfolio);

        $ids = $request->validate([
            'ids' => ['required', 'array'],
            'ids.*' => ['integer', 'exists:portfolio_photos,id'],
        ])['ids'];

        foreach ($ids as $index => $id) {
            PortfolioPhoto::where('id', $id)
                ->where('portfolio_id', $portfolio->id)
                ->update(['sort_order' => $index]);
        }

        return back();
    }

    public function destroy(Portfolio $portfolio, PortfolioPhoto $photo): RedirectResponse
    {
        Gate::authorize('update', $portfolio);

        Storage::disk('public')->delete($photo->path);
        $photo->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Photo removed.')]);

        return back();
    }
}
