<?php

use App\Http\Controllers\Settings\DefaultFolderTemplateController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::post('settings/default-folder-templates', [DefaultFolderTemplateController::class, 'store'])->name('default-folder-templates.store');
    Route::post('settings/default-folder-templates/reorder', [DefaultFolderTemplateController::class, 'reorder'])->name('default-folder-templates.reorder');
    Route::patch('settings/default-folder-templates/{defaultFolderTemplate}', [DefaultFolderTemplateController::class, 'update'])->name('default-folder-templates.update');
    Route::delete('settings/default-folder-templates/{defaultFolderTemplate}', [DefaultFolderTemplateController::class, 'destroy'])->name('default-folder-templates.destroy');
});
