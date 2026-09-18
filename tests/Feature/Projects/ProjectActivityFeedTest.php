<?php

namespace Tests\Feature\Projects;

use App\Models\PhaseActivity;
use App\Models\Project;
use App\Models\ProjectActivity;
use App\Models\ProjectFile;
use App\Models\ProjectPhase;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectActivityFeedTest extends TestCase
{
    use RefreshDatabase;

    public function test_the_feed_merges_project_and_phase_activities_sorted_newest_first()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $phase = ProjectPhase::factory()->for($project)->create();

        $older = ProjectActivity::log($project, \App\Enums\ProjectActivityType::ProjectCreated, $owner);
        $older->created_at = now()->subMinutes(10);
        $older->save();

        $newer = new PhaseActivity(['type' => 'comment', 'body' => 'Looks good']);
        $newer->project_phase_id = $phase->id;
        $newer->user_id = $owner->id;
        $newer->save();

        $response = $this->actingAs($owner)->get(route('projects.activity', $project));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('activities.data.0.kind', 'phase')
            ->where('activities.data.1.kind', 'project')
            ->where('activities.total', 2));
    }

    public function test_a_file_activity_links_to_its_folder_when_the_file_still_exists()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();
        $file = ProjectFile::factory()->for($project)->create();

        ProjectActivity::log($project, \App\Enums\ProjectActivityType::FileUploaded, $owner, $file, ['name' => $file->name]);

        $response = $this->actingAs($owner)->get(route('projects.activity', $project));

        $response->assertInertia(fn ($page) => $page
            ->where('activities.data.0.action.type', 'open_folder')
            ->where('activities.data.0.action.folder_id', $file->folder_id));
    }

    public function test_a_member_removed_activity_has_no_click_action()
    {
        $owner = User::factory()->create();
        $project = Project::factory()->for($owner, 'owner')->create();

        ProjectActivity::log($project, \App\Enums\ProjectActivityType::MemberRemoved, $owner, meta: ['name' => 'Alex Chen', 'role' => 'viewer']);

        $response = $this->actingAs($owner)->get(route('projects.activity', $project));

        $response->assertInertia(fn ($page) => $page
            ->where('activities.data.0.action', null)
            ->where('activities.data.0.summary', 'Alex Chen was removed from the project'));
    }

    public function test_non_member_cannot_view_the_activity_feed()
    {
        $stranger = User::factory()->create();
        $project = Project::factory()->create();

        $response = $this->actingAs($stranger)->get(route('projects.activity', $project));

        $response->assertForbidden();
    }
}
