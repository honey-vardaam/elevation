<?php

namespace App\Http\Requests\Comparisons;

use App\Enums\ComparisonAnnotationSide;
use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreComparisonAnnotationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', [ComparisonAnnotation::class, $this->route('comparison')]);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var Comparison $comparison */
        $comparison = $this->route('comparison');

        return [
            'side' => ['required', Rule::enum(ComparisonAnnotationSide::class)],
            'x' => ['required_unless:side,general', 'nullable', 'numeric', 'between:0,100'],
            'y' => ['required_unless:side,general', 'nullable', 'numeric', 'between:0,100'],
            'body' => ['required', 'string', 'max:5000'],
            'parent_id' => [
                'nullable',
                'integer',
                Rule::exists('comparison_annotations', 'id')->where('comparison_id', $comparison->id),
            ],
        ];
    }
}
