<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Support\ProjectActivityPresenter;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ProjectActivityController extends Controller
{
    public function index(Request $request, Project $project): Response
    {
        Gate::authorize('view', $project);

        $page = max(1, (int) $request->query('page', 1));
        $feed = ProjectActivityPresenter::feed($project, page: $page);

        return Inertia::render('projects/activity', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'activities' => $feed,
        ]);
    }
}
