<?php

namespace App\Http\Requests\Projects;

use App\Enums\ProjectPhaseStatus;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateProjectPhaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('phase'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'status' => ['required', Rule::enum(ProjectPhaseStatus::class)],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'team_id' => ['nullable', 'integer', 'exists:teams,id'],
        ];
    }
}
