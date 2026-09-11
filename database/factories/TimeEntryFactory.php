<?php

namespace Database\Factories;

use App\Models\Project;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<TimeEntry>
 */
class TimeEntryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $startedAt = fake()->dateTimeBetween('-1 week', 'now');

        return [
            'user_id' => User::factory(),
            'project_id' => Project::factory(),
            'task' => fake()->sentence(3),
            'started_at' => $startedAt,
            'ended_at' => fake()->dateTimeBetween($startedAt, (clone $startedAt)->modify('+4 hours')),
        ];
    }

    public function running(): static
    {
        return $this->state(fn () => ['ended_at' => null]);
    }
}
