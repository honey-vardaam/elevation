<?php

namespace App\Http\Controllers;

use App\Http\Requests\Clients\StoreClientRequest;
use App\Http\Requests\Clients\UpdateClientRequest;
use App\Models\Client;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ClientController extends Controller
{
    public function index(Request $request): Response
    {
        Gate::authorize('viewAny', Client::class);

        $clients = Client::query()
            ->orderBy('name')
            ->get()
            ->map(fn (Client $client) => [
                'id' => $client->id,
                'name' => $client->name,
                'company' => $client->company,
                'email' => $client->email,
                'phone' => $client->phone,
                'address' => $client->address,
                'notes' => $client->notes,
                'created_at' => $client->created_at->toIso8601String(),
            ]);

        return Inertia::render('clients/index', [
            'clients' => $clients,
        ]);
    }

    public function store(StoreClientRequest $request): RedirectResponse
    {
        Client::create($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client added.')]);

        return to_route('clients.index');
    }

    public function update(UpdateClientRequest $request, Client $client): RedirectResponse
    {
        $client->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client updated.')]);

        return to_route('clients.index');
    }

    public function destroy(Request $request, Client $client): RedirectResponse
    {
        Gate::authorize('delete', $client);

        $client->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => __('Client removed.')]);

        return to_route('clients.index');
    }
}
