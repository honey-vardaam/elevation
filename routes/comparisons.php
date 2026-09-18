<?php

use App\Http\Controllers\ComparisonAnnotationController;
use App\Http\Controllers\ComparisonController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('comparisons', [ComparisonController::class, 'index'])->name('comparisons.index');
    Route::post('comparisons', [ComparisonController::class, 'store'])->name('comparisons.store');
    Route::get('comparisons/{comparison}', [ComparisonController::class, 'show'])->name('comparisons.show');
    Route::patch('comparisons/{comparison}', [ComparisonController::class, 'update'])->name('comparisons.update');
    Route::delete('comparisons/{comparison}', [ComparisonController::class, 'destroy'])->name('comparisons.destroy');

    Route::prefix('comparisons/{comparison}')->name('comparisons.')->scopeBindings()->group(function () {
        Route::post('reviewers', [ComparisonController::class, 'storeReviewer'])->name('reviewers.store');
        Route::delete('reviewers/{reviewer}', [ComparisonController::class, 'destroyReviewer'])->name('reviewers.destroy');

        Route::post('annotations', [ComparisonAnnotationController::class, 'store'])->name('annotations.store');
        Route::delete('annotations/{annotation}', [ComparisonAnnotationController::class, 'destroy'])->name('annotations.destroy');
        Route::patch('annotations/{annotation}/resolve', [ComparisonAnnotationController::class, 'resolve'])->name('annotations.resolve');
    });
});
