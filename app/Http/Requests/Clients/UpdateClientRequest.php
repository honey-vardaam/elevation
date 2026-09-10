<?php

namespace App\Http\Requests\Clients;

use App\Concerns\ClientValidationRules;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class UpdateClientRequest extends FormRequest
{
    use ClientValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('update', $this->route('client'));
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->clientRules();
    }
}
