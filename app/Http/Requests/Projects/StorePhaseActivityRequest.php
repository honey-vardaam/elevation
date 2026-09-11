<?php

namespace App\Http\Requests\Projects;

use App\Models\PhaseActivity;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StorePhaseActivityRequest extends FormRequest
{
    public function authorize(): bool
    {
        $phase = $this->route('phase');

        if (! Gate::allows('create', [PhaseActivity::class, $phase])) {
            return false;
        }

        if ($this->input('type') === 'approval' && ! $phase->project->isManagedBy($this->user())) {
            return false;
        }

        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $phase = $this->route('phase');
        $project = $phase->project;

        return [
            'type' => ['required', Rule::in(['comment', 'change_request', 'review', 'approval'])],
            'body' => [$this->input('type') === 'approval' ? 'nullable' : 'required', 'string', 'max:5000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('phase_activities', 'id')->where('project_phase_id', $phase->id),
            ],
            'reviewer_id' => [
                'nullable',
                Rule::requiredIf($this->input('type') === 'review'),
                'integer',
                function (string $attribute, mixed $value, \Closure $fail) use ($project) {
                    $hasAccess = $value === $project->owner_id
                        || $project->members()->where('user_id', $value)->exists();

                    if (! $hasAccess) {
                        $fail('The selected reviewer does not have access to this project.');
                    }
                },
            ],
            'attachment' => ['nullable', 'file', 'max:102400'],
        ];
    }
}
