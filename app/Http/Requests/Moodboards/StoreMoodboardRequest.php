<?php

namespace App\Http\Requests\Moodboards;

use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreMoodboardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, ValidationRule|\Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'project_id' => [
                'nullable',
                'integer',
                'exists:projects,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    if ($value === null) {
                        return;
                    }

                    $project = Project::find($value);

                    if (! $project || ! $project->isManagedBy($this->user())) {
                        $fail('Only the project owner or a manager can add moodboards to this project.');
                    }
                },
            ],
        ];
    }
}
