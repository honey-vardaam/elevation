import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { ArrowDown, ArrowUp, Pencil, Trash2 } from 'lucide-react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { destroy, reorder, store, update } from '@/routes/phase-templates';
import type { PhaseTemplateSummary } from '@/types';

export function PhaseTemplateList({
    phaseTemplates,
}: {
    phaseTemplates: PhaseTemplateSummary[];
}) {
    const [editing, setEditing] = useState<PhaseTemplateSummary | null>(null);
    const [deleting, setDeleting] = useState<PhaseTemplateSummary | null>(null);
    const [adding, setAdding] = useState(false);

    function move(index: number, direction: -1 | 1) {
        const target = index + direction;
        if (target < 0 || target >= phaseTemplates.length) {
            return;
        }

        const ids = phaseTemplates.map((t) => t.id);
        [ids[index], ids[target]] = [ids[target], ids[index]];

        router.post(reorder().url, { ids }, { preserveScroll: true });
    }

    function removeTemplate(template: PhaseTemplateSummary) {
        router.delete(destroy(template.id).url, { preserveScroll: true });
    }

    return (
        <div className="space-y-2">
            {phaseTemplates.length === 0 && (
                <p className="text-muted-foreground text-sm">
                    No phases yet. Add the steps of your organization's process
                    below - projects can then adopt this pipeline.
                </p>
            )}

            {phaseTemplates.map((template, index) => (
                <div
                    key={template.id}
                    className="flex items-center justify-between gap-3 rounded-lg border p-3"
                >
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex flex-col">
                            <button
                                type="button"
                                disabled={index === 0}
                                onClick={() => move(index, -1)}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                                <ArrowUp className="size-3.5" />
                            </button>
                            <button
                                type="button"
                                disabled={index === phaseTemplates.length - 1}
                                onClick={() => move(index, 1)}
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                            >
                                <ArrowDown className="size-3.5" />
                            </button>
                        </div>
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
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={() => setAdding(true)}
            >
                Add phase
            </Button>

            <PhaseTemplateEditDialog
                template={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <PhaseTemplateAddDialog open={adding} onOpenChange={setAdding} />

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>Delete phase?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        from the pipeline. Projects that already adopted it keep
                        their own copy of this phase.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleting) {
                                    removeTemplate(deleting);
                                    setDeleting(null);
                                }
                            }}
                        >
                            Delete phase
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
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
                        <div className="grid gap-2">
                            <Label htmlFor="phase-name">Name</Label>
                            <Input
                                id="phase-name"
                                defaultValue={template.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                            <InputError message={errors.name} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phase-description">
                                Description
                            </Label>
                            <Textarea
                                id="phase-description"
                                rows={3}
                                defaultValue={template.description ?? ''}
                                onChange={(e) =>
                                    setData('description', e.target.value)
                                }
                            />
                            <InputError message={errors.description} />
                        </div>
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
                    <div className="grid gap-2">
                        <Label htmlFor="new-phase-name">Name</Label>
                        <Input
                            id="new-phase-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                        <InputError message={errors.name} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new-phase-description">
                            Description
                        </Label>
                        <Textarea
                            id="new-phase-description"
                            rows={3}
                            value={data.description}
                            onChange={(e) =>
                                setData('description', e.target.value)
                            }
                        />
                        <InputError message={errors.description} />
                    </div>
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
