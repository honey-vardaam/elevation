<?php

use App\Http\Controllers\Settings\PhaseTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/phase-templates', [PhaseTemplateController::class, 'index'])->name('phase-templates.index');
    Route::post('settings/phase-templates', [PhaseTemplateController::class, 'store'])->name('phase-templates.store');
    Route::post('settings/phase-templates/reorder', [PhaseTemplateController::class, 'reorder'])->name('phase-templates.reorder');
    Route::patch('settings/phase-templates/{phaseTemplate}', [PhaseTemplateController::class, 'update'])->name('phase-templates.update');
    Route::delete('settings/phase-templates/{phaseTemplate}', [PhaseTemplateController::class, 'destroy'])->name('phase-templates.destroy');
});
