import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { Folder, GripVertical, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { SortableList } from '@/components/sortable-list';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import {
    destroy,
    reorder,
    store,
    update,
} from '@/routes/default-folder-templates';
import type { DefaultFolderTemplateSummary } from '@/types';

export function DefaultFolderTemplateList({
    folderTemplates,
    addOpen,
    onAddOpenChange,
}: {
    folderTemplates: DefaultFolderTemplateSummary[];
    addOpen: boolean;
    onAddOpenChange: (open: boolean) => void;
}) {
    const [editing, setEditing] = useState<DefaultFolderTemplateSummary | null>(
        null,
    );
    const [deleting, setDeleting] =
        useState<DefaultFolderTemplateSummary | null>(null);

    function handleReorder(ids: number[]) {
        router.post(reorder().url, { ids }, { preserveScroll: true });
    }

    return (
        <div className="space-y-2">
            {folderTemplates.length === 0 && (
                <EmptyState
                    icon={Folder}
                    message="No default folders yet. Add the root folders every new project should start with."
                />
            )}

            <SortableList
                items={folderTemplates}
                onReorder={handleReorder}
                className="space-y-2"
                renderItem={(folder, _index, { handle, isDragging }) => (
                    <div
                        className={cn(
                            'bg-card flex items-center justify-between gap-3 rounded-lg border p-3 transition-shadow',
                            isDragging && 'shadow-lg',
                        )}
                    >
                        <div className="flex min-w-0 items-center gap-3">
                            <button
                                type="button"
                                ref={handle.ref}
                                {...handle.attributes}
                                {...handle.listeners}
                                className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                            >
                                <GripVertical className="size-4" />
                                <span className="sr-only">Drag to reorder</span>
                            </button>
                            <Folder className="text-muted-foreground size-4 shrink-0" />
                            <p className="min-w-0 truncate text-sm font-medium">
                                {folder.name}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditing(folder)}
                            >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleting(folder)}
                            >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </div>
                )}
            />

            <FolderTemplateEditDialog
                template={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <FolderTemplateAddDialog
                open={addOpen}
                onOpenChange={onAddOpenChange}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete default folder?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        from the default structure. Projects that already have
                        this folder keep it.
                    </>
                }
                confirmLabel="Delete folder"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </div>
    );
}

function FolderTemplateEditDialog({
    template,
    onOpenChange,
}: {
    template: DefaultFolderTemplateSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        name: template?.name ?? '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!template) {
            return;
        }

        patch(update(template.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={template !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit default folder</DialogTitle>
                {template && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="folder-template-name"
                            label="Name"
                            error={errors.name}
                        >
                            <Input
                                id="folder-template-name"
                                defaultValue={template.name}
                                placeholder="Site Photos"
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button variant="secondary">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={processing}>
                                {processing && <Spinner />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}

function FolderTemplateAddDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post(store().url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Add default folder</DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        htmlFor="new-folder-template-name"
                        label="Name"
                        error={errors.name}
                    >
                        <Input
                            id="new-folder-template-name"
                            value={data.name}
                            placeholder="Site Photos"
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Add folder
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
