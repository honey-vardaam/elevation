<?php

use App\Http\Controllers\Settings\TeamController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/teams', [TeamController::class, 'index'])->name('teams.index');
    Route::post('settings/teams', [TeamController::class, 'store'])->name('teams.store');
    Route::patch('settings/teams/{team}', [TeamController::class, 'update'])->name('teams.update');
    Route::delete('settings/teams/{team}', [TeamController::class, 'destroy'])->name('teams.destroy');
});
