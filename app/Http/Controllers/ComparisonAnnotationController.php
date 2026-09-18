<?php

namespace App\Http\Controllers;

use App\Http\Requests\Comparisons\StoreComparisonAnnotationRequest;
use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class ComparisonAnnotationController extends Controller
{
    public function store(StoreComparisonAnnotationRequest $request, Comparison $comparison): RedirectResponse
    {
        $annotation = new ComparisonAnnotation($request->validated());
        $annotation->comparison_id = $comparison->id;
        $annotation->user_id = $request->user()->id;
        $annotation->save();

        return back();
    }

    public function destroy(Request $request, Comparison $comparison, ComparisonAnnotation $annotation): RedirectResponse
    {
        abort_unless($annotation->comparison_id === $comparison->id, 404);
        Gate::authorize('delete', $annotation);

        $annotation->delete();

        return back();
    }

    /**
     * Toggle a pin/thread resolved or reopen it - the root comment only,
     * since a reply thread resolves as a unit.
     */
    public function resolve(Request $request, Comparison $comparison, ComparisonAnnotation $annotation): RedirectResponse
    {
        abort_unless($annotation->comparison_id === $comparison->id, 404);
        abort_unless($annotation->parent_id === null, 404);
        Gate::authorize('resolve', $annotation);

        if ($annotation->resolved_at !== null) {
            $annotation->resolved_at = null;
            $annotation->resolved_by = null;
        } else {
            $annotation->resolved_at = now();
            $annotation->resolved_by = $request->user()->id;
        }

        $annotation->save();

        return back();
    }
}
