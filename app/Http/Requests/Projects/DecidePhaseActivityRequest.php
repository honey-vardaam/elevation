<?php

namespace App\Http\Requests\Projects;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class DecidePhaseActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('decide', $this->route('activity'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'decision' => ['required', Rule::in(['approved', 'changes_requested'])],
            'note' => [
                $this->input('decision') === 'changes_requested' ? 'required' : 'nullable',
                'string',
                'max:2000',
            ],
        ];
    }
}
