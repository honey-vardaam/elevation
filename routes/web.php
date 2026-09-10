<?php

use App\Http\Controllers\PublicPortfolioController;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');

Route::get('portfolio/{portfolio:share_slug}', [PublicPortfolioController::class, 'show'])->name('portfolio.public');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::inertia('dashboard', 'dashboard')->name('dashboard');
});

require __DIR__.'/settings.php';
require __DIR__.'/projects.php';
require __DIR__.'/users.php';
require __DIR__.'/clients.php';
require __DIR__.'/calendar.php';
require __DIR__.'/company.php';
require __DIR__.'/portfolios.php';
