<?php

namespace App\Http\Requests\PhaseFlowSteps;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class ConnectPhaseFlowStepRequest extends FormRequest
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
        $flow = $this->route('phaseFlowTemplate');
        $step = $this->route('step');

        return [
            'next_phase_template_id' => [
                'nullable',
                'integer',
                Rule::exists('phase_templates', 'id')->where('phase_flow_template_id', $flow->id),
                Rule::notIn([$step->id]),
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'next_phase_template_id.not_in' => 'A step cannot connect to itself.',
        ];
    }
}
