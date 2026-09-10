<?php

namespace Database\Factories;

use App\Enums\PortfolioSectionType;
use App\Models\Portfolio;
use App\Models\PortfolioSection;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PortfolioSection>
 */
class PortfolioSectionFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'portfolio_id' => Portfolio::factory(),
            'type' => fake()->randomElement(PortfolioSectionType::defaults()),
            'title' => null,
            'content' => null,
            'sort_order' => 0,
            'is_visible' => true,
        ];
    }
}
