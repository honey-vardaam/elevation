<?php

namespace App\Http\Requests\PhaseTemplates;

use App\Concerns\PhaseTemplateValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePhaseTemplateRequest extends FormRequest
{
    use PhaseTemplateValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('phaseTemplate'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->phaseTemplateRules();
    }
}
