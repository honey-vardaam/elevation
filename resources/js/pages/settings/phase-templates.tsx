import { Head } from '@inertiajs/react';
import Heading from '@/components/heading';
import { PhaseTemplateList } from '@/components/settings/phase-template-list';
import { index } from '@/routes/phase-templates';
import type { PhaseTemplateSummary } from '@/types';

export default function PhaseTemplates({
    phaseTemplates,
}: {
    phaseTemplates: PhaseTemplateSummary[];
}) {
    return (
        <>
            <Head title="Phase templates" />

            <h1 className="sr-only">Phase templates</h1>

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Phase templates"
                    description="Define the steps of your organization's process. New projects can adopt this pipeline and track their progress through it."
                />

                <PhaseTemplateList phaseTemplates={phaseTemplates} />
            </div>
        </>
    );
}

PhaseTemplates.layout = {
    breadcrumbs: [{ title: 'Phase templates', href: index() }],
};
