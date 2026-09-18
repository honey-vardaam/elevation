<?php

use App\Http\Controllers\MoodboardController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('moodboards', [MoodboardController::class, 'index'])->name('moodboards.index');
    Route::post('moodboards', [MoodboardController::class, 'store'])->name('moodboards.store');
    Route::get('moodboards/{moodboard}', [MoodboardController::class, 'show'])->name('moodboards.show');
    Route::patch('moodboards/{moodboard}', [MoodboardController::class, 'update'])->name('moodboards.update');
    Route::delete('moodboards/{moodboard}', [MoodboardController::class, 'destroy'])->name('moodboards.destroy');
    Route::put('moodboards/{moodboard}/canvas', [MoodboardController::class, 'syncCanvas'])->name('moodboards.canvas');
    Route::post('moodboards/{moodboard}/images', [MoodboardController::class, 'uploadImage'])->name('moodboards.images.store');
});
