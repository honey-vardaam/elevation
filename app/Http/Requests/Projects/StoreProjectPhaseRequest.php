<?php

namespace App\Http\Requests\Projects;

use App\Models\ProjectPhase;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreProjectPhaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', [ProjectPhase::class, $this->route('project')]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $project = $this->route('project');

        return [
            'phase_template_id' => [
                'required',
                'integer',
                Rule::exists('phase_templates', 'id')->where('phase_flow_template_id', $project->phase_flow_template_id),
                Rule::unique('project_phases')->where(fn ($query) => $query->where('project_id', $project->id)),
            ],
        ];
    }
}
