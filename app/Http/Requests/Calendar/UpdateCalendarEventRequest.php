<?php

namespace App\Http\Requests\Calendar;

use App\Concerns\CalendarEventValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateCalendarEventRequest extends FormRequest
{
    use CalendarEventValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('calendarEvent'));
    }

    /**
     * @return array<string, ValidationRule|\Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->calendarEventRules();
    }
}
