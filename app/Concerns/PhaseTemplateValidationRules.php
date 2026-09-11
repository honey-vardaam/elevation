<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;

trait PhaseTemplateValidationRules
{
    /**
     * Get the validation rules used to validate phase templates.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function phaseTemplateRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
        ];
    }
}
