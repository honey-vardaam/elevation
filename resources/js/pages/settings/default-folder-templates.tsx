import { Head } from '@inertiajs/react';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import Heading from '@/components/heading';
import { DefaultFolderTemplateList } from '@/components/settings/default-folder-template-list';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/default-folder-templates';
import type { DefaultFolderTemplateSummary } from '@/types';

export default function DefaultFolderTemplates({
    defaultFolderTemplates,
}: {
    defaultFolderTemplates: DefaultFolderTemplateSummary[];
}) {
    const [addingFolder, setAddingFolder] = useState(false);

    return (
        <>
            <Head title="Default folders" />

            <h1 className="sr-only">Default folders</h1>

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
        </>
    );
}

DefaultFolderTemplates.layout = {
    breadcrumbs: [{ title: 'Default folders', href: index() }],
};
