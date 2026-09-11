<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\PublicPortfolioController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('portfolio/{portfolio:share_slug}', [PublicPortfolioController::class, 'show'])->name('portfolio.public');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/phase-templates.php';
require __DIR__.'/inbox.php';
require __DIR__.'/projects.php';
require __DIR__.'/users.php';
require __DIR__.'/clients.php';
require __DIR__.'/calendar.php';
require __DIR__.'/company.php';
require __DIR__.'/portfolios.php';
require __DIR__.'/time-tracker.php';
require __DIR__.'/tasks.php';
