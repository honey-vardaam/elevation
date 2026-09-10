<?php

namespace Database\Factories;

use App\Models\CalendarEvent;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CalendarEvent>
 */
class CalendarEventFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startAt = fake()->dateTimeBetween('-1 week', '+3 weeks');

        return [
            'user_id' => User::factory(),
            'project_id' => null,
            'title' => fake()->sentence(3),
            'description' => fake()->optional()->sentence(),
            'start_at' => $startAt,
            'end_at' => null,
            'all_day' => false,
            'remind_minutes_before' => null,
            'reminded_at' => null,
        ];
    }
}
