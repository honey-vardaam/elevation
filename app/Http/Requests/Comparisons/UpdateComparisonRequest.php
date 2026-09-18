<?php

namespace App\Http\Requests\Comparisons;

use App\Enums\ComparisonMode;
use App\Models\Comparison;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateComparisonRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('comparison'));
    }

    /**
     * @return array<string, ValidationRule|\Closure|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Comparison $comparison */
        $comparison = $this->route('comparison');

        return [
            'title' => ['sometimes', 'required', 'string', 'max:255'],
            'mode' => ['sometimes', Rule::enum(ComparisonMode::class)],
            'left_file_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('project_files', 'id')->where('project_id', $comparison->project_id),
            ],
            'right_file_id' => [
                'sometimes',
                'nullable',
                'integer',
                Rule::exists('project_files', 'id')->where('project_id', $comparison->project_id),
            ],
        ];
    }
}
