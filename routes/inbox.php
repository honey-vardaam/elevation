<?php

use App\Http\Controllers\InboxController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('inbox', [InboxController::class, 'index'])->name('inbox.index');
});
