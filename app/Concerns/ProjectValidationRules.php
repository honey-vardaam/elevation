<?php

namespace App\Concerns;

use App\Enums\ProjectStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Validation\Rule;

trait ProjectValidationRules
{
    /**
     * Get the validation rules used to validate projects.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function projectRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'banner' => ['nullable', 'image', 'max:5120'],
            'client_name' => ['nullable', 'string', 'max:255'],
            'client_email' => ['nullable', 'string', 'email', 'max:255'],
            'client_phone' => ['nullable', 'string', 'max:255'],
            'site_address' => ['nullable', 'string', 'max:255'],
            'site_area' => ['nullable', 'string', 'max:255'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'status' => ['nullable', Rule::enum(ProjectStatus::class)],
        ];
    }
}
