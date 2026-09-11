<?php

use App\Http\Controllers\TimeTrackerController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('time-tracker', [TimeTrackerController::class, 'store'])->name('time-tracker.store');
    Route::post('time-tracker/{timeEntry}/stop', [TimeTrackerController::class, 'stop'])->name('time-tracker.stop');
});
