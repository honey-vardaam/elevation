import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { DefaultFolderTemplateList } from '@/components/settings/default-folder-template-list';
import { PhaseTemplateList } from '@/components/settings/phase-template-list';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/phase-templates';
import type {
    DefaultFolderTemplateSummary,
    PhaseTemplateSummary,
} from '@/types';

export default function PhaseTemplates({
    phaseTemplates,
    defaultFolderTemplates,
}: {
    phaseTemplates: PhaseTemplateSummary[];
    defaultFolderTemplates: DefaultFolderTemplateSummary[];
}) {
    const [addingPhase, setAddingPhase] = useState(false);
    const [addingFolder, setAddingFolder] = useState(false);

    return (
        <>
            <Head title="Project setup" />

            <h1 className="sr-only">Project setup</h1>

            <div className="space-y-8">
                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Heading
                            variant="small"
                            title="Phase pipeline"
                            description="The steps of your organization's process - projects can adopt this pipeline."
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingPhase(true)}
                        >
                            <Plus className="size-4" />
                            Add phase
                        </Button>
                    </div>

                    <PhaseTemplateList
                        phaseTemplates={phaseTemplates}
                        addOpen={addingPhase}
                        onAddOpenChange={setAddingPhase}
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                        <Heading
                            variant="small"
                            title="Default folder structure"
                            description="The root folders every new project starts with."
                        />
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setAddingFolder(true)}
                        >
                            <Plus className="size-4" />
                            Add folder
                        </Button>
                    </div>

                    <DefaultFolderTemplateList
                        folderTemplates={defaultFolderTemplates}
                        addOpen={addingFolder}
                        onAddOpenChange={setAddingFolder}
                    />
                </div>
            </div>
        </>
    );
}

PhaseTemplates.layout = {
    breadcrumbs: [{ title: 'Project setup', href: index() }],
};
