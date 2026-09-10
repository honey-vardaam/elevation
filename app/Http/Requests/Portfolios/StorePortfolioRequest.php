<?php

namespace App\Http\Requests\Portfolios;

use App\Models\Portfolio;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StorePortfolioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return Gate::allows('create', Portfolio::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'year' => ['required', 'integer', 'min:2000', 'max:2100', 'unique:portfolios,year'],
        ];
    }
}
