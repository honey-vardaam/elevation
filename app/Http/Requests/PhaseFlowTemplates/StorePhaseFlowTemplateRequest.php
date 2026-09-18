<?php

namespace App\Http\Requests\PhaseFlowTemplates;

use App\Concerns\PhaseTemplateValidationRules;
use App\Models\PhaseFlowTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePhaseFlowTemplateRequest extends FormRequest
{
    use PhaseTemplateValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', PhaseFlowTemplate::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->phaseTemplateRules();
    }
}
