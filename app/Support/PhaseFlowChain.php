<?php

namespace App\Support;

use App\Models\PhaseTemplate;
use Illuminate\Database\Eloquent\Collection;

/**
 * Walks a phase flow template's steps to check they form exactly one
 * connected, acyclic chain - the invariant a flow's graph must satisfy to
 * be applied to a project. Each step points at its successor via
 * next_phase_template_id; there's no separate edges table.
 */
final class PhaseFlowChain
{
    /**
     * @param  Collection<int, PhaseTemplate>  $steps
     * @return Collection<int, PhaseTemplate>|null head-to-tail order, or null
     *                                              if the steps don't form a
     *                                              single chain covering all of them
     */
    public static function walk(Collection $steps): ?Collection
    {
        if ($steps->isEmpty()) {
            return null;
        }

        $byId = $steps->keyBy('id');
        $incomingCounts = [];

        foreach ($steps as $step) {
            if ($step->next_phase_template_id === null) {
                continue;
            }

            if (! $byId->has($step->next_phase_template_id)) {
                return null;
            }

            $incomingCounts[$step->next_phase_template_id] = ($incomingCounts[$step->next_phase_template_id] ?? 0) + 1;

            if ($incomingCounts[$step->next_phase_template_id] > 1) {
                return null;
            }
        }

        $heads = $steps->filter(fn (PhaseTemplate $step) => ($incomingCounts[$step->id] ?? 0) === 0);

        if ($heads->count() !== 1) {
            return null;
        }

        $ordered = new Collection;
        $visited = [];
        $current = $heads->first();

        while ($current !== null) {
            if (isset($visited[$current->id])) {
                return null;
            }

            $visited[$current->id] = true;
            $ordered->push($current);
            $current = $current->next_phase_template_id !== null ? $byId->get($current->next_phase_template_id) : null;
        }

        return $ordered->count() === $steps->count() ? $ordered : null;
    }
}
