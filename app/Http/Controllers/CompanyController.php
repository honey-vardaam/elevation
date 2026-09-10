<?php

namespace App\Http\Controllers;

use App\Http\Requests\Company\UpdateCompanyRequest;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class CompanyController extends Controller
{
    public function edit(): Response
    {
        $company = Company::current();

        Gate::authorize('view', $company);

        return Inertia::render('company/edit', [
            'company' => $this->toArray($company),
        ]);
    }

    public function update(UpdateCompanyRequest $request): RedirectResponse
    {
        $company = Company::current();

        $company->fill($request->safe()->except('logo'));

        if ($request->hasFile('logo')) {
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }

            $company->logo_path = $request->file('logo')->store('company', 'public');
        }

        $company->save();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Company info updated.')]);

        return to_route('company.edit');
    }

    /**
     * @return array<string, mixed>
     */
    private function toArray(Company $company): array
    {
        return [
            'name' => $company->name,
            'logo_url' => $company->logo_path ? Storage::disk('public')->url($company->logo_path) : null,
            'address' => $company->address,
            'phone' => $company->phone,
            'email' => $company->email,
            'website' => $company->website,
            'about' => $company->about,
        ];
    }
}
