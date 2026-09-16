<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;

trait TeamValidationRules
{
    /**
     * Get the validation rules used to validate teams.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function teamRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'member_ids' => ['array'],
            'member_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
