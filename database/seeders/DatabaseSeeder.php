<?php

namespace Database\Seeders;

use App\Enums\ProjectRole;
use App\Enums\UserRole;
use App\Models\Project;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $owner = User::firstOrNew(['email' => 'test@example.com']);
        $owner->name = 'Test User';
        $owner->password = $owner->password ?? 'password';
        $owner->email_verified_at = $owner->email_verified_at ?? now();
        $owner->role = UserRole::Owner;
        $owner->save();

        $staff = User::firstOrNew(['email' => 'staff@example.com']);
        $staff->name = 'Staff Member';
        $staff->password = $staff->password ?? 'password';
        $staff->email_verified_at = $staff->email_verified_at ?? now();
        $staff->role = UserRole::Staff;
        $staff->save();

        $this->seedProject(
            name: 'Harborview Residence',
            owner: $owner,
            staff: $staff,
            attributes: [
                'description' => 'A 4-bedroom waterfront residence with an emphasis on natural light and passive cooling.',
                'client_name' => 'The Whitfield Family',
                'client_email' => 'whitfield@example.com',
                'client_phone' => '555-0142',
                'site_address' => '12 Harborview Lane',
                'site_area' => '3,200 sq ft',
                'start_date' => now()->subMonths(2)->toDateString(),
                'end_date' => now()->addMonths(10)->toDateString(),
            ],
        );

        $this->seedProject(
            name: 'Cedar Ridge Office Park',
            owner: $owner,
            staff: $staff,
            attributes: [
                'description' => 'A three-building commercial campus with shared courtyard and parking structure.',
                'client_name' => 'Cedar Ridge Development Group',
                'client_email' => 'contact@cedarridgedev.example.com',
                'site_address' => '400 Cedar Ridge Parkway',
                'site_area' => '48,000 sq ft',
                'start_date' => now()->subMonth()->toDateString(),
            ],
        );
    }

    /**
     * @param  array<string, mixed>  $attributes
     */
    private function seedProject(string $name, User $owner, User $staff, array $attributes): void
    {
        $project = Project::firstOrNew(['name' => $name]);
        $isNew = ! $project->exists;

        $project->fill($attributes);
        $project->owner_id = $owner->id;
        $project->save();

        if (! $isNew) {
            return;
        }

        $project->seedDefaultFolders($owner);

        $member = new ProjectMember(['role' => ProjectRole::Editor]);
        $member->project_id = $project->id;
        $member->user_id = $staff->id;
        $member->save();
    }
}
