<?php

namespace App\Http\Requests\Clients;

use App\Concerns\ClientValidationRules;
use App\Models\Client;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreClientRequest extends FormRequest
{
    use ClientValidationRules;

    public function authorize(): bool
    {
        return Gate::allows('create', Client::class);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return $this->clientRules();
    }
}
