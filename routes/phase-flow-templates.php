<?php

use App\Http\Controllers\Settings\PhaseFlowStepController;
use App\Http\Controllers\Settings\PhaseFlowTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/phase-flows', [PhaseFlowTemplateController::class, 'index'])->name('phase-flow-templates.index');
    Route::post('settings/phase-flows', [PhaseFlowTemplateController::class, 'store'])->name('phase-flow-templates.store');
    Route::get('settings/phase-flows/{phaseFlowTemplate}', [PhaseFlowTemplateController::class, 'show'])->name('phase-flow-templates.show');
    Route::patch('settings/phase-flows/{phaseFlowTemplate}', [PhaseFlowTemplateController::class, 'update'])->name('phase-flow-templates.update');
    Route::delete('settings/phase-flows/{phaseFlowTemplate}', [PhaseFlowTemplateController::class, 'destroy'])->name('phase-flow-templates.destroy');

    Route::prefix('settings/phase-flows/{phaseFlowTemplate}')->name('phase-flow-templates.steps.')->scopeBindings()->group(function () {
        Route::post('steps', [PhaseFlowStepController::class, 'store'])->name('store');
        Route::patch('steps/{step}', [PhaseFlowStepController::class, 'update'])->name('update');
        Route::patch('steps/{step}/connect', [PhaseFlowStepController::class, 'connect'])->name('connect');
        Route::delete('steps/{step}', [PhaseFlowStepController::class, 'destroy'])->name('destroy');
    });
});
