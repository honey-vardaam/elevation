<?php

use App\Http\Controllers\ProjectController;
use App\Http\Controllers\Projects\FolderController;
use App\Http\Controllers\Projects\PhaseActivityController;
use App\Http\Controllers\Projects\ProjectFileController;
use App\Http\Controllers\Projects\ProjectMemberController;
use App\Http\Controllers\Projects\ProjectPhaseController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::resource('projects', ProjectController::class)->except(['create', 'edit']);

    Route::prefix('projects/{project}')->name('projects.')->scopeBindings()->group(function () {
        Route::post('folders', [FolderController::class, 'store'])->name('folders.store');
        Route::patch('folders/{folder}', [FolderController::class, 'update'])->name('folders.update');
        Route::delete('folders/{folder}', [FolderController::class, 'destroy'])->name('folders.destroy');

        Route::post('files', [ProjectFileController::class, 'store'])->name('files.store');
        Route::patch('files/{file}', [ProjectFileController::class, 'update'])->name('files.update');
        Route::delete('files/{file}', [ProjectFileController::class, 'destroy'])->name('files.destroy');
        Route::get('files/{file}/download', [ProjectFileController::class, 'download'])->name('files.download');

        Route::post('members', [ProjectMemberController::class, 'store'])->name('members.store');
        Route::patch('members/{member}', [ProjectMemberController::class, 'update'])->name('members.update');
        Route::delete('members/{member}', [ProjectMemberController::class, 'destroy'])->name('members.destroy');

        Route::post('phases', [ProjectPhaseController::class, 'store'])->name('phases.store');
        Route::post('phases/reorder', [ProjectPhaseController::class, 'reorder'])->name('phases.reorder');
        Route::patch('phases/{phase}', [ProjectPhaseController::class, 'update'])->name('phases.update');
        Route::delete('phases/{phase}', [ProjectPhaseController::class, 'destroy'])->name('phases.destroy');
        Route::post('phases/{phase}/advance', [ProjectPhaseController::class, 'advance'])->name('phases.advance');

        Route::post('phases/{phase}/activities', [PhaseActivityController::class, 'store'])->name('phases.activities.store');
        Route::patch('phases/{phase}/activities/{activity}/resolve', [PhaseActivityController::class, 'resolve'])->name('phases.activities.resolve');
        Route::patch('phases/{phase}/activities/{activity}/decide', [PhaseActivityController::class, 'decide'])->name('phases.activities.decide');
        Route::post('phases/{phase}/activities/{activity}/resubmit', [PhaseActivityController::class, 'resubmit'])->name('phases.activities.resubmit');
    });
});
