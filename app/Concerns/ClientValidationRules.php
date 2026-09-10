<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;

trait ClientValidationRules
{
    /**
     * Get the validation rules used to validate clients.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function clientRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'company' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'string', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'max:255'],
            'address' => ['nullable', 'string', 'max:255'],
            'notes' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
