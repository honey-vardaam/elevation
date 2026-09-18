<?php

namespace App\Http\Requests\PhaseFlowTemplates;

use App\Concerns\PhaseTemplateValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdatePhaseFlowTemplateRequest extends FormRequest
{
    use PhaseTemplateValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('phaseFlowTemplate'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->phaseTemplateRules();
    }
}
