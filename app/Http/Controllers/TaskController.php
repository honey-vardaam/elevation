<?php

namespace App\Http\Controllers;

use App\Http\Requests\Tasks\StoreTaskRequest;
use App\Http\Requests\Tasks\UpdateTaskRequest;
use App\Models\Task;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class TaskController extends Controller
{
    public function store(StoreTaskRequest $request): RedirectResponse
    {
        $task = new Task(['title' => $request->validated('title')]);
        $task->user_id = $request->user()->id;
        $task->project_id = $request->validated('project_id');
        $task->save();

        return back();
    }

    public function update(UpdateTaskRequest $request, Task $task): RedirectResponse
    {
        $isCompleted = (bool) $request->validated('is_completed');

        $task->is_completed = $isCompleted;
        $task->completed_at = $isCompleted ? now() : null;
        $task->save();

        return back();
    }

    public function destroy(Request $request, Task $task): RedirectResponse
    {
        Gate::authorize('delete', $task);

        $task->delete();

        return back();
    }
}
