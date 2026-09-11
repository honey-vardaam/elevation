<?php

namespace App\Http\Requests\PhaseTemplates;

use App\Concerns\PhaseTemplateValidationRules;
use App\Models\PhaseTemplate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePhaseTemplateRequest extends FormRequest
{
    use PhaseTemplateValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', PhaseTemplate::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->phaseTemplateRules();
    }
}
