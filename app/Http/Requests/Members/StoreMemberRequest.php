<?php

namespace App\Http\Requests\Members;

use App\Enums\ProjectRole;
use App\Models\Project;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreMemberRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('manageMembers', $this->route('project'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'email' => ['required', 'email', 'exists:users,email'],
            'role' => ['required', Rule::enum(ProjectRole::class)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            $user = User::where('email', $this->input('email'))->first();

            if ($user === null) {
                return;
            }

            /** @var Project $project */
            $project = $this->route('project');

            if ($project->owner_id === $user->id) {
                $validator->errors()->add('email', 'This user already owns the project.');

                return;
            }

            if ($project->members()->where('user_id', $user->id)->exists()) {
                $validator->errors()->add('email', 'This user already has access to the project.');
            }
        });
    }
}
