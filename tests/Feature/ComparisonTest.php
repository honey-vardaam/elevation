<?php

namespace Tests\Feature;

use App\Models\Comparison;
use App\Models\ComparisonAnnotation;
use App\Models\Project;
use App\Models\ProjectFile;
use App\Models\ProjectMember;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ComparisonTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_project_member_can_start_a_comparison_from_a_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $file = ProjectFile::factory()->for($project)->create(['name' => 'Floor Plan v1.pdf']);

        $response = $this->actingAs($user)->post(route('comparisons.store'), [
            'project_id' => $project->id,
            'left_file_id' => $file->id,
        ]);

        $comparison = Comparison::firstOrFail();
        $response->assertRedirect(route('comparisons.show', $comparison));
        $this->assertSame($file->id, $comparison->left_file_id);
        $this->assertNull($comparison->right_file_id);
        $this->assertSame($user->id, $comparison->created_by);
        $this->assertSame('Floor Plan v1.pdf', $comparison->title);
        $this->assertFalse($comparison->isComplete());
    }

    public function test_a_comparison_can_be_started_with_no_file_yet()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();

        $this->actingAs($user)->post(route('comparisons.store'), [
            'project_id' => $project->id,
        ])->assertSessionHasNoErrors();

        $comparison = Comparison::firstOrFail();
        $this->assertNull($comparison->left_file_id);
        $this->assertSame('New comparison', $comparison->title);
    }

    public function test_a_stranger_cannot_start_a_comparison_on_a_project_they_cannot_access()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $file = ProjectFile::factory()->for($project)->create();

        $this->actingAs($user)->post(route('comparisons.store'), [
            'project_id' => $project->id,
            'left_file_id' => $file->id,
        ])->assertSessionHasErrors('project_id');

        $this->assertSame(0, Comparison::count());
    }

    public function test_a_file_from_another_project_cannot_be_used_as_the_left_file()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->editor()->create();
        $foreignFile = ProjectFile::factory()->for(Project::factory())->create();

        $this->actingAs($user)->post(route('comparisons.store'), [
            'project_id' => $project->id,
            'left_file_id' => $foreignFile->id,
        ])->assertSessionHasErrors('left_file_id');
    }

    public function test_picking_the_second_file_completes_the_comparison()
    {
        $project = Project::factory()->create();
        $left = ProjectFile::factory()->for($project)->create();
        $right = ProjectFile::factory()->for($project)->create();
        $comparison = Comparison::factory()->for($project)->create(['left_file_id' => $left->id]);

        $this->actingAs($project->owner)
            ->patch(route('comparisons.update', $comparison), ['right_file_id' => $right->id])
            ->assertSessionHasNoErrors();

        $this->assertTrue($comparison->fresh()->isComplete());
    }

    public function test_a_viewer_cannot_manage_the_comparison_but_can_view_it()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $comparison = Comparison::factory()->for($project)->create();

        $this->actingAs($viewer)->get(route('comparisons.show', $comparison))
            ->assertOk()
            ->assertInertia(fn ($page) => $page->where('can.update', false));

        $this->actingAs($viewer)
            ->patch(route('comparisons.update', $comparison), ['title' => 'Renamed'])
            ->assertForbidden();
    }

    public function test_a_stranger_cannot_view_a_comparison()
    {
        $comparison = Comparison::factory()->create();

        $this->actingAs(User::factory()->create())
            ->get(route('comparisons.show', $comparison))
            ->assertForbidden();
    }

    public function test_the_creator_can_share_the_comparison_with_a_user_outside_the_project()
    {
        $creator = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($creator)->manager()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $creator->id]);
        $outsider = User::factory()->create();

        $this->actingAs($creator)->post(route('comparisons.reviewers.store', $comparison), [
            'user_id' => $outsider->id,
        ])->assertSessionHasNoErrors();

        $this->assertTrue($comparison->fresh()->reviewers->contains('id', $outsider->id));

        // The invited outsider now has view access despite no project membership.
        $this->actingAs($outsider)->get(route('comparisons.show', $comparison))->assertOk();
    }

    public function test_a_non_manager_cannot_invite_reviewers()
    {
        $creator = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($creator)->editor()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => User::factory()->create()->id]);

        $this->actingAs($creator)->post(route('comparisons.reviewers.store', $comparison), [
            'user_id' => User::factory()->create()->id,
        ])->assertForbidden();
    }

    public function test_removing_a_reviewer_revokes_their_access()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);
        $reviewer = User::factory()->create();
        $comparison->reviewers()->attach($reviewer->id, ['invited_by' => $project->owner_id, 'created_at' => now()]);

        $this->actingAs($project->owner)
            ->delete(route('comparisons.reviewers.destroy', [$comparison, $reviewer]))
            ->assertSessionHasNoErrors();

        $this->assertFalse($comparison->fresh()->reviewers->contains('id', $reviewer->id));
        $this->actingAs($reviewer)->get(route('comparisons.show', $comparison))->assertForbidden();
    }

    public function test_any_viewer_can_post_a_pinned_annotation()
    {
        $viewer = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($viewer)->viewer()->create();
        $comparison = Comparison::factory()->for($project)->create();

        $this->actingAs($viewer)->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'left',
            'x' => 42.5,
            'y' => 10.25,
            'body' => 'What changed here?',
        ])->assertSessionHasNoErrors();

        $annotation = ComparisonAnnotation::firstOrFail();
        $this->assertSame('left', $annotation->side->value);
        $this->assertSame(42.5, $annotation->x);
        $this->assertSame($viewer->id, $annotation->user_id);
    }

    public function test_a_general_comment_does_not_require_coordinates()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);

        $this->actingAs($project->owner)->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'general',
            'body' => 'Overall this looks good.',
        ])->assertSessionHasNoErrors();

        $this->assertNull(ComparisonAnnotation::firstOrFail()->x);
    }

    public function test_a_pinned_annotation_requires_coordinates()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);

        $this->actingAs($project->owner)->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'right',
            'body' => 'Missing coordinates.',
        ])->assertSessionHasErrors(['x', 'y']);
    }

    public function test_a_stranger_cannot_comment()
    {
        $comparison = Comparison::factory()->create();

        $this->actingAs(User::factory()->create())->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'general',
            'body' => 'Uninvited comment.',
        ])->assertForbidden();
    }

    public function test_only_the_author_can_delete_their_annotation()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);
        $author = User::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $annotation = ComparisonAnnotation::factory()->for($comparison)->for($author, 'author')->create();

        $this->actingAs($project->owner)
            ->delete(route('comparisons.annotations.destroy', [$comparison, $annotation]))
            ->assertForbidden();

        $this->actingAs($author)
            ->delete(route('comparisons.annotations.destroy', [$comparison, $annotation]))
            ->assertSessionHasNoErrors();

        $this->assertModelMissing($annotation);
    }

    public function test_a_manager_can_resolve_someone_elses_thread()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);
        $author = User::factory()->create();
        ProjectMember::factory()->for($project)->for($author)->viewer()->create();
        $annotation = ComparisonAnnotation::factory()->for($comparison)->for($author, 'author')->create();

        $this->actingAs($project->owner)
            ->patch(route('comparisons.annotations.resolve', [$comparison, $annotation]))
            ->assertSessionHasNoErrors();

        $resolved = $annotation->fresh();
        $this->assertNotNull($resolved->resolved_at);
        $this->assertSame($project->owner_id, $resolved->resolved_by);

        // Resolving again reopens it.
        $this->actingAs($project->owner)
            ->patch(route('comparisons.annotations.resolve', [$comparison, $annotation]));
        $this->assertNull($annotation->fresh()->resolved_at);
    }

    public function test_replying_nests_under_the_parent_annotation()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);
        $root = ComparisonAnnotation::factory()->for($comparison)->for($project->owner, 'author')->create(['side' => 'general']);

        $this->actingAs($project->owner)->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'general',
            'body' => 'Replying to myself',
            'parent_id' => $root->id,
        ])->assertSessionHasNoErrors();

        $this->actingAs($project->owner)->get(route('comparisons.show', $comparison))
            ->assertInertia(fn ($page) => $page
                ->has('annotations', 1)
                ->has('annotations.0.replies', 1));
    }

    public function test_a_reply_id_from_another_comparison_is_rejected()
    {
        $project = Project::factory()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $project->owner_id]);
        $foreignAnnotation = ComparisonAnnotation::factory()->create();

        $this->actingAs($project->owner)->post(route('comparisons.annotations.store', $comparison), [
            'side' => 'general',
            'body' => 'Hijack attempt',
            'parent_id' => $foreignAnnotation->id,
        ])->assertSessionHasErrors('parent_id');
    }

    public function test_index_lists_only_accessible_comparisons()
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($user)->viewer()->create();

        Comparison::factory()->for($project)->create(['title' => 'Mine']);
        Comparison::factory()->create(['title' => 'Someone elses']);

        $this->actingAs($user)->get(route('comparisons.index'))
            ->assertInertia(fn ($page) => $page
                ->has('comparisons', 1)
                ->where('comparisons.0.title', 'Mine'));
    }

    public function test_the_creator_can_delete_the_comparison()
    {
        $creator = User::factory()->create();
        $project = Project::factory()->create();
        ProjectMember::factory()->for($project)->for($creator)->editor()->create();
        $comparison = Comparison::factory()->for($project)->create(['created_by' => $creator->id]);

        $this->actingAs($creator)->delete(route('comparisons.destroy', $comparison))
            ->assertRedirect(route('comparisons.index'));

        $this->assertModelMissing($comparison);
    }
}
