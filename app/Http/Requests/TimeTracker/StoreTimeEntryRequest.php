<?php

namespace App\Http\Requests\TimeTracker;

use App\Models\Project;
use App\Models\TimeEntry;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreTimeEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', TimeEntry::class);
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
            'task' => ['required', 'string', 'max:255'],
        ];
    }
}
