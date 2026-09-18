<?php

namespace App\Http\Requests\PhaseFlowSteps;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePhaseFlowStepRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('phaseFlowTemplate'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'position_x' => ['nullable', 'integer'],
            'position_y' => ['nullable', 'integer'],
        ];
    }
}
