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
            'apply_phase_pipeline' => ['boolean'],
            'members' => ['array'],
            'members.*.user_id' => ['required', 'integer', 'exists:users,id'],
            'members.*.role' => ['required', Rule::enum(ProjectRole::class)],
        ];
    }
}
