import { Link, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import { GitBranch, Pencil, Trash2 } from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { Field } from '@/components/field';
import { Badge } from '@/components/ui/badge';
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
import { destroy, show, store, update } from '@/routes/phase-flow-templates';
import type { PhaseFlowTemplateSummary } from '@/types';

export function PhaseFlowTemplateList({
    phaseFlowTemplates,
    addOpen,
    onAddOpenChange,
}: {
    phaseFlowTemplates: PhaseFlowTemplateSummary[];
    addOpen: boolean;
    onAddOpenChange: (open: boolean) => void;
}) {
    const [editing, setEditing] = useState<PhaseFlowTemplateSummary | null>(
        null,
    );
    const [deleting, setDeleting] = useState<PhaseFlowTemplateSummary | null>(
        null,
    );

    return (
        <div className="space-y-2">
            {phaseFlowTemplates.length === 0 && (
                <EmptyState
                    icon={GitBranch}
                    message="No phase flows yet. Create one and lay out its steps on a canvas - projects can then adopt it."
                />
            )}

            <div className="space-y-2">
                {phaseFlowTemplates.map((flow) => (
                    <div
                        key={flow.id}
                        className="bg-card flex items-center justify-between gap-3 rounded-lg border p-3"
                    >
                        <Link
                            href={show(flow.id).url}
                            className="min-w-0 flex-1"
                        >
                            <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium">
                                    {flow.name}
                                </p>
                                <Badge
                                    variant={
                                        flow.is_ready ? 'secondary' : 'outline'
                                    }
                                >
                                    {flow.is_ready
                                        ? `${flow.steps_count} ${flow.steps_count === 1 ? 'step' : 'steps'}`
                                        : flow.steps_count === 0
                                          ? 'No steps'
                                          : 'Not connected'}
                                </Badge>
                            </div>
                            {flow.description && (
                                <p className="text-muted-foreground truncate text-xs">
                                    {flow.description}
                                </p>
                            )}
                        </Link>
                        <div className="flex shrink-0 items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setEditing(flow)}
                            >
                                <Pencil className="size-4" />
                                <span className="sr-only">Rename</span>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => setDeleting(flow)}
                            >
                                <Trash2 className="size-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            <PhaseFlowTemplateEditDialog
                flow={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />
            <PhaseFlowTemplateAddDialog
                open={addOpen}
                onOpenChange={onAddOpenChange}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Delete phase flow?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        and all of its steps. Projects that already adopted it
                        keep their own copy of its phases.
                    </>
                }
                confirmLabel="Delete flow"
                formAction={deleting ? destroy.form(deleting.id) : undefined}
                onSuccess={() => setDeleting(null)}
            />
        </div>
    );
}

function PhaseFlowTemplateEditDialog({
    flow,
    onOpenChange,
}: {
    flow: PhaseFlowTemplateSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        name: flow?.name ?? '',
        description: flow?.description ?? '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!flow) {
            return;
        }

        patch(update(flow.id).url, {
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={flow !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Rename phase flow</DialogTitle>
                {flow && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="flow-name"
                            label="Name"
                            error={errors.name}
                        >
                            <Input
                                id="flow-name"
                                defaultValue={flow.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <Field
                            htmlFor="flow-description"
                            label="Description"
                            error={errors.description}
                        >
                            <Textarea
                                id="flow-description"
                                rows={3}
                                defaultValue={flow.description ?? ''}
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

function PhaseFlowTemplateAddDialog({
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
                <DialogTitle>New phase flow</DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        htmlFor="new-flow-name"
                        label="Name"
                        error={errors.name}
                    >
                        <Input
                            id="new-flow-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="new-flow-description"
                        label="Description"
                        error={errors.description}
                    >
                        <Textarea
                            id="new-flow-description"
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
                            Create flow
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
