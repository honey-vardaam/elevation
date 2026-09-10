<?php

use App\Http\Controllers\CalendarController;
use App\Http\Controllers\CalendarEventController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('calendar', [CalendarController::class, 'index'])->name('calendar.index');

    Route::post('calendar-events', [CalendarEventController::class, 'store'])->name('calendar-events.store');
    Route::patch('calendar-events/{calendarEvent}', [CalendarEventController::class, 'update'])->name('calendar-events.update');
    Route::delete('calendar-events/{calendarEvent}', [CalendarEventController::class, 'destroy'])->name('calendar-events.destroy');
});
