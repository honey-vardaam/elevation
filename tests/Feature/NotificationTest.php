<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\User;
use App\Notifications\PhaseActivityNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_user_can_mark_their_own_notification_as_read()
    {
        $user = User::factory()->create();
        $phase = ProjectPhase::factory()->for(Project::factory())->create();
        $user->notify(new PhaseActivityNotification($phase, User::factory()->create(), 'Test message.', 'comment'));
        $notification = $user->notifications()->sole();

        $response = $this->actingAs($user)->patch(route('notifications.read', $notification));

        $response->assertSessionHasNoErrors();
        $this->assertNotNull($notification->fresh()->read_at);
    }

    public function test_a_user_cannot_mark_another_users_notification_as_read()
    {
        $owner = User::factory()->create();
        $phase = ProjectPhase::factory()->for(Project::factory())->create();
        $owner->notify(new PhaseActivityNotification($phase, User::factory()->create(), 'Test message.', 'comment'));
        $notification = $owner->notifications()->sole();

        $outsider = User::factory()->create();

        $response = $this->actingAs($outsider)->patch(route('notifications.read', $notification));

        $response->assertNotFound();
        $this->assertNull($notification->fresh()->read_at);
    }

    public function test_a_user_can_mark_all_of_their_notifications_as_read()
    {
        $user = User::factory()->create();
        $phase = ProjectPhase::factory()->for(Project::factory())->create();
        $actor = User::factory()->create();
        $user->notify(new PhaseActivityNotification($phase, $actor, 'First.', 'comment'));
        $user->notify(new PhaseActivityNotification($phase, $actor, 'Second.', 'comment'));

        $response = $this->actingAs($user)->post(route('notifications.read-all'));

        $response->assertSessionHasNoErrors();
        $this->assertCount(0, $user->fresh()->unreadNotifications);
    }

    public function test_a_user_can_clear_all_of_their_notifications()
    {
        $user = User::factory()->create();
        $phase = ProjectPhase::factory()->for(Project::factory())->create();
        $actor = User::factory()->create();
        $user->notify(new PhaseActivityNotification($phase, $actor, 'First.', 'comment'));
        $user->notify(new PhaseActivityNotification($phase, $actor, 'Second.', 'comment'));

        $otherUser = User::factory()->create();
        $otherUser->notify(new PhaseActivityNotification($phase, $actor, 'Someone else\'s.', 'comment'));

        $response = $this->actingAs($user)->delete(route('notifications.clear-all'));

        $response->assertSessionHasNoErrors();
        $this->assertCount(0, $user->fresh()->notifications);
        $this->assertCount(1, $otherUser->fresh()->notifications);
    }
}
