<?php

namespace Database\Seeders;

use App\Enums\PhaseActivityType;
use App\Enums\ProjectPhaseStatus;
use App\Enums\ProjectStatus;
use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectPhase;
use App\Models\Task;
use App\Models\TimeEntry;
use App\Models\User;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Seeder;

/**
 * Backfills realistic-looking activity for the local "Test User" account so
 * the dashboard's data-driven cards (Hours per week, Weekly output, Needs
 * your attention) have something worth looking at while iterating on their
 * design. Not part of the default `db:seed` run - invoke explicitly:
 * `php artisan db:seed --class=DashboardDemoSeeder`.
 */
class DashboardDemoSeeder extends Seeder
{
    private const array TASK_TITLES = [
        'Client coordination call',
        'Schematic drawings',
        'Site visit notes',
        'Permit documentation',
        'Material specification',
        'Budget review',
        'Consultant coordination',
        'Redline markups',
        'Vendor follow-up',
    ];

    public function run(): void
    {
        $user = User::where('email', 'test@example.com')->first();

        if (! $user) {
            $this->command?->warn('test@example.com not found - run the default seeder first.');

            return;
        }

        $projects = Project::where('owner_id', $user->id)->get();

        if ($projects->isEmpty()) {
            $this->command?->warn('No projects owned by test@example.com - run the default seeder first.');

            return;
        }

        $staff = User::where('email', 'staff@example.com')->first() ?? $user;

        $this->seedTimeEntries($user, $projects);
        $this->seedWeeklyOutput($user, $projects);
        $this->seedNeedsAttention($staff, $projects);

        $this->command?->info('Seeded dashboard demo data for test@example.com.');
    }

    /**
     * @param  Collection<int, Project>  $projects
     */
    private function seedTimeEntries(User $user, Collection $projects): void
    {
        for ($daysAgo = 0; $daysAgo < 35; $daysAgo++) {
            // Skip some days entirely so the bars aren't perfectly uniform.
            if (random_int(1, 10) <= 2) {
                continue;
            }

            $day = today()->subDays($daysAgo);

            foreach (range(1, random_int(1, 2)) as $slot => $_) {
                $hours = random_int(1, 4) + (random_int(0, 3) / 4);
                $start = $day->copy()->setTime(9 + ((int) $slot) * 4, 0);

                TimeEntry::factory()
                    ->for($user)
                    ->for($projects->random())
                    ->create([
                        'task' => fake()->randomElement(self::TASK_TITLES),
                        'started_at' => $start,
                        'ended_at' => $start->copy()->addMinutes((int) ($hours * 60)),
                    ]);
            }
        }
    }

    /**
     * @param  Collection<int, Project>  $projects
     */
    private function seedWeeklyOutput(User $user, Collection $projects): void
    {
        $phase = ProjectPhase::firstOrCreate(
            ['project_id' => $projects->first()->id, 'name' => 'Design Development'],
            ['sort_order' => 1, 'status' => ProjectPhaseStatus::InProgress],
        );

        for ($daysAgo = 0; $daysAgo < 7; $daysAgo++) {
            $day = today()->subDays($daysAgo);

            foreach (range(1, random_int(0, 3)) as $_) {
                Task::factory()->for($user)->completed()->create([
                    'project_id' => $projects->random()->id,
                    'title' => fake()->randomElement(self::TASK_TITLES),
                    'completed_at' => $day->copy()->setTime(random_int(9, 17), 0),
                ]);
            }

            foreach (range(1, random_int(0, 2)) as $_) {
                $activity = new PhaseActivity([
                    'type' => PhaseActivityType::Comment,
                    'body' => fake()->sentence(),
                ]);
                $activity->project_phase_id = $phase->id;
                $activity->user_id = $user->id;
                $activity->created_at = $day->copy()->setTime(random_int(9, 17), 0);
                $activity->updated_at = $activity->created_at;
                $activity->save();
            }
        }
    }

    /**
     * @param  Collection<int, Project>  $projects
     */
    private function seedNeedsAttention(User $author, Collection $projects): void
    {
        $eligible = $projects->filter(fn (Project $project) => $project->status !== ProjectStatus::Completed);

        foreach ($eligible as $project) {
            $phase = ProjectPhase::firstOrCreate(
                ['project_id' => $project->id, 'name' => 'Construction Documents'],
                ['sort_order' => 2, 'status' => ProjectPhaseStatus::InProgress],
            );
            $phase->status = ProjectPhaseStatus::InProgress;
            $phase->save();

            foreach (range(1, random_int(1, 3)) as $_) {
                $activity = new PhaseActivity([
                    'type' => PhaseActivityType::ChangeRequest,
                    'body' => fake()->sentence(10),
                ]);
                $activity->project_phase_id = $phase->id;
                $activity->user_id = $author->id;
                $activity->save();
            }
        }
    }
}
