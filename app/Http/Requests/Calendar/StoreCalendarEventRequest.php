<?php

namespace App\Http\Requests\Calendar;

use App\Concerns\CalendarEventValidationRules;
use App\Models\CalendarEvent;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreCalendarEventRequest extends FormRequest
{
    use CalendarEventValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', CalendarEvent::class);
    }

    /**
     * @return array<string, ValidationRule|\Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->calendarEventRules();
    }
}
