<?php

namespace Database\Factories;

use App\Enums\ActivityStatus;
use App\Enums\PhaseActivityType;
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

    /**
     * A request with no reviewer tagged - anyone with manage access can
     * resolve it directly.
     */
    public function changeRequest(): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => PhaseActivityType::ChangeRequest,
            'activity_status' => ActivityStatus::Open,
        ]);
    }

    /**
     * A request with a reviewer tagged - only that reviewer (or a manager)
     * can approve or request changes on it via `decide()`.
     */
    public function review(?User $reviewer = null): static
    {
        return $this->state(fn (array $attributes) => [
            'type' => PhaseActivityType::ChangeRequest,
            'reviewer_id' => $reviewer?->id ?? User::factory(),
            'activity_status' => ActivityStatus::Open,
        ]);
    }
}
