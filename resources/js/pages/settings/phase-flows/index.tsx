import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { PhaseFlowTemplateList } from '@/components/settings/phase-flow-template-list';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/phase-flow-templates';
import type { PhaseFlowTemplateSummary } from '@/types';

export default function PhaseFlows({
    phaseFlowTemplates,
}: {
    phaseFlowTemplates: PhaseFlowTemplateSummary[];
}) {
    const [addingFlow, setAddingFlow] = useState(false);

    return (
        <>
            <Head title="Phase flows" />

            <h1 className="sr-only">Phase flows</h1>

            <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                    <Heading
                        variant="small"
                        title="Phase flows"
                        description="Visual pipelines projects can adopt - draw each flow's steps on a canvas."
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setAddingFlow(true)}
                    >
                        <Plus className="size-4" />
                        New flow
                    </Button>
                </div>

                <PhaseFlowTemplateList
                    phaseFlowTemplates={phaseFlowTemplates}
                    addOpen={addingFlow}
                    onAddOpenChange={setAddingFlow}
                />
            </div>
        </>
    );
}

PhaseFlows.layout = {
    breadcrumbs: [{ title: 'Phase flows', href: index() }],
};
