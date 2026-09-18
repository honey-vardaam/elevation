<?php

namespace App\Http\Requests\Projects;

use App\Concerns\ProjectValidationRules;
use App\Enums\ProjectRole;
use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreProjectRequest extends FormRequest
{
    use ProjectValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', Project::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            ...$this->projectRules(),
            'use_default_folders' => ['boolean'],
            'phase_flow_template_id' => ['nullable', 'integer', Rule::exists('phase_flow_templates', 'id')],
            'members' => ['array'],
            'members.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'members.*.role' => ['required', Rule::enum(ProjectRole::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            ...$this->projectMessages(),
            'members.*.user_id.required' => 'Select a user for each team member added.',
            'members.*.user_id.exists' => 'One of the selected members no longer exists.',
            'members.*.role.enum' => 'Choose a valid role for each team member.',
        ];
    }

    /**
     * @return array<string, string>
     */
    public function attributes(): array
    {
        return $this->projectAttributes();
    }
}
