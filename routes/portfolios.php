<?php

use App\Http\Controllers\PortfolioController;
use App\Http\Controllers\PortfolioPhotoController;
use App\Http\Controllers\PortfolioSectionController;
use App\Http\Controllers\PortfolioTestimonialController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('portfolios', [PortfolioController::class, 'index'])->name('portfolios.index');
    Route::post('portfolios', [PortfolioController::class, 'store'])->name('portfolios.store');
    Route::get('portfolios/{portfolio}', [PortfolioController::class, 'show'])->name('portfolios.show');
    Route::patch('portfolios/{portfolio}', [PortfolioController::class, 'update'])->name('portfolios.update');
    Route::delete('portfolios/{portfolio}', [PortfolioController::class, 'destroy'])->name('portfolios.destroy');

    Route::post('portfolios/{portfolio}/sections', [PortfolioSectionController::class, 'store'])->name('portfolio-sections.store');
    Route::patch('portfolios/{portfolio}/sections/{section}', [PortfolioSectionController::class, 'update'])->name('portfolio-sections.update');
    Route::post('portfolios/{portfolio}/sections/reorder', [PortfolioSectionController::class, 'reorder'])->name('portfolio-sections.reorder');
    Route::delete('portfolios/{portfolio}/sections/{section}', [PortfolioSectionController::class, 'destroy'])->name('portfolio-sections.destroy');

    Route::post('portfolios/{portfolio}/photos', [PortfolioPhotoController::class, 'store'])->name('portfolio-photos.store');
    Route::post('portfolios/{portfolio}/photos/reorder', [PortfolioPhotoController::class, 'reorder'])->name('portfolio-photos.reorder');
    Route::delete('portfolios/{portfolio}/photos/{photo}', [PortfolioPhotoController::class, 'destroy'])->name('portfolio-photos.destroy');

    Route::post('portfolios/{portfolio}/testimonials', [PortfolioTestimonialController::class, 'store'])->name('portfolio-testimonials.store');
    Route::patch('portfolios/{portfolio}/testimonials/{testimonial}', [PortfolioTestimonialController::class, 'update'])->name('portfolio-testimonials.update');
    Route::delete('portfolios/{portfolio}/testimonials/{testimonial}', [PortfolioTestimonialController::class, 'destroy'])->name('portfolio-testimonials.destroy');
});
