<?php

use App\Http\Controllers\CompanyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('settings/company', [CompanyController::class, 'edit'])->name('company.edit');
    Route::patch('settings/company', [CompanyController::class, 'update'])->name('company.update');
});
