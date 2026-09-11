<?php

namespace Database\Factories;

use App\Enums\PhaseActivityType;
use App\Enums\ReviewStatus;
use App\Models\PhaseActivity;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PhaseActivity>
 */
class PhaseActivityFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'project_phase_id' => ProjectPhase::factory(),
            'user_id' => User::factory(),
            'type' => PhaseActivityType::Comment,
            'body' => fake()->sentence(),
        ];
    }

    public function changeRequest(): static
    {
        return $this->state(fn (array $attributes) => ['type' => PhaseActivityType::ChangeRequest]);
    }

    public function review(?User $reviewer = null): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => PhaseActivityType::Review,
            'reviewer_id' => $reviewer?->id ?? User::factory(),
            'review_status' => ReviewStatus::Pending,
        ]);
    }
}
