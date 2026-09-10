<?php

use App\Http\Controllers\CompanyController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('company', [CompanyController::class, 'edit'])->name('company.edit');
    Route::patch('company', [CompanyController::class, 'update'])->name('company.update');
});
