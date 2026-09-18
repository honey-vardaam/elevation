<?php

use App\Http\Controllers\TimeTrackerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('time-tracker', [TimeTrackerController::class, 'store'])->name('time-tracker.store');
    Route::post('time-tracker/{timeEntry}/stop', [TimeTrackerController::class, 'stop'])->name('time-tracker.stop');
    Route::post('time-tracker/{timeEntry}/pause', [TimeTrackerController::class, 'pause'])->name('time-tracker.pause');
    Route::post('time-tracker/{timeEntry}/resume', [TimeTrackerController::class, 'resume'])->name('time-tracker.resume');
});
