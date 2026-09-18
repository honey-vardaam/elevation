<?php

namespace App\Http\Requests\Comparisons;

use App\Models\Project;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreComparisonRequest extends FormRequest
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
            'project_id' => [
                'required',
                'integer',
                'exists:projects,id',
                function (string $attribute, mixed $value, \Closure $fail): void {
                    $project = Project::find($value);

                    if (! $project || ! $project->hasAccess($this->user())) {
                        $fail('You do not have access to that project.');
                    }
                },
            ],
            'left_file_id' => [
                'nullable',
                'integer',
                Rule::exists('project_files', 'id')->where('project_id', $this->input('project_id')),
            ],
            'title' => ['nullable', 'string', 'max:255'],
        ];
    }
}
