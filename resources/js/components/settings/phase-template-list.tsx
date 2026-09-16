import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { GripVertical, Layers, Pencil, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { destroy, reorder, store, update } from '@/routes/phase-templates';
import type { PhaseTemplateSummary } from '@/types';

export function PhaseTemplateList({
    phaseTemplates,
    addOpen,
    onAddOpenChange,
}: {
    phaseTemplates: PhaseTemplateSummary[];
    addOpen: boolean;
    onAddOpenChange: (open: boolean) => void;
}) {
    const [editing, setEditing] = useState<PhaseTemplateSummary | null>(null);
    const [deleting, setDeleting] = useState<PhaseTemplateSummary | null>(null);

    function handleReorder(ids: number[]) {
        router.post(reorder().url, { ids }, { preserveScroll: true });
    }

    return (
        <div className="space-y-2">
            {phaseTemplates.length === 0 && (
                <EmptyState
                    icon={Layers}
                    message="No phases yet. Add the steps of your organization's process - projects can then adopt this pipeline."
                />
            )}

            <SortableList
                items={phaseTemplates}
                onReorder={handleReorder}
                className="space-y-2"
                renderItem={(template, _index, { handle, isDragging }) => (
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
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium">
                                    {template.name}
                                </p>
                                {template.description && (
                                    <p className="text-muted-foreground truncate text-xs">
                                        {template.description}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditing(template)}
                            >
                                <Pencil className="size-4" />
                                <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleting(template)}
                            >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </div>
                )}
            />

            <PhaseTemplateEditDialog
                template={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <PhaseTemplateAddDialog
                open={addOpen}
                onOpenChange={onAddOpenChange}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete phase?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        from the pipeline. Projects that already adopted it keep
                        their own copy of this phase.
                    </>
                }
                confirmLabel="Delete phase"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </div>
    );
}

function PhaseTemplateEditDialog({
    template,
    onOpenChange,
}: {
    template: PhaseTemplateSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        name: template?.name ?? '',
        description: template?.description ?? '',
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
                <DialogTitle>Edit phase</DialogTitle>
                {template && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="phase-name"
                            label="Name"
                            error={errors.name}
                        >
                            <Input
                                id="phase-name"
                                defaultValue={template.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <Field
                            htmlFor="phase-description"
                            label="Description"
                            error={errors.description}
                        >
                            <Textarea
                                id="phase-description"
                                rows={3}
                                defaultValue={template.description ?? ''}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
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

function PhaseTemplateAddDialog({
    open,
    onOpenChange,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
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
                <DialogTitle>Add phase</DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        htmlFor="new-phase-name"
                        label="Name"
                        error={errors.name}
                    >
                        <Input
                            id="new-phase-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="new-phase-description"
                        label="Description"
                        error={errors.description}
                    >
                        <Textarea
                            id="new-phase-description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                    </Field>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            Add phase
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
