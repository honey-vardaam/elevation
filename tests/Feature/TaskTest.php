<?php

namespace Tests\Feature;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_create_a_task()
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post(route('tasks.store'), [
            'title' => 'Write the spec',
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('tasks', [
            'user_id' => $user->id,
            'title' => 'Write the spec',
            'is_completed' => false,
        ]);
    }

    public function test_toggling_a_task_sets_and_clears_completed_at()
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $this->actingAs($user)->patch(route('tasks.update', $task), ['is_completed' => true]);
        $task->refresh();
        $this->assertTrue($task->is_completed);
        $this->assertNotNull($task->completed_at);

        $this->actingAs($user)->patch(route('tasks.update', $task), ['is_completed' => false]);
        $task->refresh();
        $this->assertFalse($task->is_completed);
        $this->assertNull($task->completed_at);
    }

    public function test_a_user_cannot_touch_another_users_task()
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        $task = Task::factory()->for($owner)->create();

        $this->actingAs($other)->patch(route('tasks.update', $task), ['is_completed' => true])
            ->assertForbidden();

        $this->actingAs($other)->delete(route('tasks.destroy', $task))
            ->assertForbidden();
    }

    public function test_a_user_can_delete_their_own_task()
    {
        $user = User::factory()->create();
        $task = Task::factory()->for($user)->create();

        $this->actingAs($user)->delete(route('tasks.destroy', $task))->assertRedirect();

        $this->assertDatabaseMissing('tasks', ['id' => $task->id]);
    }
}
