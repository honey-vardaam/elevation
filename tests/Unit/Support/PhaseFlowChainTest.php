<?php

namespace Tests\Unit\Support;

use App\Models\PhaseTemplate;
use App\Support\PhaseFlowChain;
use Illuminate\Database\Eloquent\Collection;
use Tests\TestCase;

class PhaseFlowChainTest extends TestCase
{
    public function test_empty_set_is_not_a_chain()
    {
        $this->assertNull(PhaseFlowChain::walk(new Collection));
    }

    public function test_single_unconnected_step_is_its_own_chain()
    {
        $step = $this->step(1, null);

        $ordered = PhaseFlowChain::walk(new Collection([$step]));

        $this->assertNotNull($ordered);
        $this->assertSame([1], $ordered->pluck('id')->all());
    }

    public function test_a_simple_chain_is_walked_head_to_tail()
    {
        $steps = new Collection([
            $this->step(3, null),
            $this->step(1, 2),
            $this->step(2, 3),
        ]);

        $ordered = PhaseFlowChain::walk($steps);

        $this->assertNotNull($ordered);
        $this->assertSame([1, 2, 3], $ordered->pluck('id')->all());
    }

    public function test_two_disconnected_components_are_rejected()
    {
        $steps = new Collection([
            $this->step(1, 2),
            $this->step(2, null),
            $this->step(3, 4),
            $this->step(4, null),
        ]);

        $this->assertNull(PhaseFlowChain::walk($steps));
    }

    public function test_a_cycle_is_rejected()
    {
        $steps = new Collection([
            $this->step(1, 2),
            $this->step(2, 1),
        ]);

        $this->assertNull(PhaseFlowChain::walk($steps));
    }

    public function test_a_step_pointing_outside_the_given_set_is_rejected()
    {
        $steps = new Collection([
            $this->step(1, 99),
        ]);

        $this->assertNull(PhaseFlowChain::walk($steps));
    }

    public function test_two_steps_pointing_at_the_same_target_is_rejected()
    {
        $steps = new Collection([
            $this->step(1, 3),
            $this->step(2, 3),
            $this->step(3, null),
        ]);

        $this->assertNull(PhaseFlowChain::walk($steps));
    }

    private function step(int $id, ?int $next): PhaseTemplate
    {
        return (new PhaseTemplate)->forceFill([
            'id' => $id,
            'next_phase_template_id' => $next,
        ]);
    }
}
