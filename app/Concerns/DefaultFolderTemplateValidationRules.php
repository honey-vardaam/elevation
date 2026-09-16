<?php

namespace App\Concerns;

use Illuminate\Contracts\Validation\ValidationRule;

trait DefaultFolderTemplateValidationRules
{
    /**
     * Get the validation rules used to validate default folder templates.
     *
     * @return array<string, array<int, ValidationRule|array<mixed>|string>>
     */
    protected function defaultFolderTemplateRules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
        ];
    }
}
