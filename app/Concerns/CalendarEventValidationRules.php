<?php

namespace App\Concerns;

use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;

trait CalendarEventValidationRules
{
    /**
     * Get the validation rules used to validate calendar events.
     *
     * @return array<string, array<int, ValidationRule|\Closure|array<mixed>|string>>
     */
    protected function calendarEventRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'project_id' => [
                'nullable',
                'integer',
                'exists:projects,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null) {
                        return;
                    }

                    $project = Project::find($value);

                    if (! $project || ! $project->hasAccess($this->user())) {
                        $fail('You do not have access to that project.');
                    }
                },
            ],
            'all_day' => ['boolean'],
            'start_date' => ['required', 'date'],
            'start_time' => ['nullable', 'date_format:H:i'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'end_time' => ['nullable', 'date_format:H:i'],
            'remind_minutes_before' => ['nullable', 'integer', 'min:0', 'max:10080'],
        ];
    }
}
