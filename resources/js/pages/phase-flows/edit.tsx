import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    type Connection,
    type Edge,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    type FormEvent,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ArrowLeft,
    MoreHorizontal,
    Pencil,
    Plus,
    SlidersHorizontal,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Field } from '@/components/field';
import {
    PhaseFlowStepNode,
    type PhaseFlowStepNodeData,
} from '@/components/phase-flows/phase-flow-step-node';
import AppLayout from '@/layouts/app-layout';
import { useAppearance } from '@/hooks/use-appearance';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    destroy as destroyFlow,
    index as flowsIndex,
    show,
    update as updateFlow,
} from '@/routes/phase-flow-templates';
import {
    connect,
    destroy as destroyStep,
    store as storeStep,
    update as updateStep,
} from '@/routes/phase-flow-templates/steps';
import type { PhaseFlowStepSummary, PhaseFlowTemplateDetail } from '@/types';

const nodeTypes = { phaseStep: PhaseFlowStepNode };

export default function EditPhaseFlow({
    flow,
    can,
}: {
    flow: PhaseFlowTemplateDetail;
    can: { update: boolean; delete?: boolean };
}) {
    const [addingStep, setAddingStep] = useState(false);
    const [editingFlowDetails, setEditingFlowDetails] = useState(false);
    const [deletingFlow, setDeletingFlow] = useState(false);
    const [editingStep, setEditingStep] = useState<PhaseFlowStepSummary | null>(
        null,
    );
    const [deletingStep, setDeletingStep] =
        useState<PhaseFlowStepSummary | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(flow.name);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const { resolvedAppearance } = useAppearance();

    useEffect(() => {
        setTitleDraft(flow.name);
    }, [flow.name]);

    useEffect(() => {
        if (isEditingTitle) {
            titleInputRef.current?.focus();
            titleInputRef.current?.select();
        }
    }, [isEditingTitle]);

    const handleCommitRename = useCallback(() => {
        setIsEditingTitle(false);
        const trimmed = titleDraft.trim();
        if (!trimmed) {
            setTitleDraft(flow.name);
            return;
        }
        if (trimmed !== flow.name) {
            router.patch(
                updateFlow(flow.id).url,
                {
                    name: trimmed,
                    description: flow.description ?? '',
                },
                {
                    preserveScroll: true,
                    preserveState: true,
                    onError: (errors) => {
                        toast.error(errors.name ?? 'Could not rename flow.');
                        setTitleDraft(flow.name);
                    },
                },
            );
        }
    }, [titleDraft, flow.name, flow.id, flow.description]);

    const handleCancelRename = useCallback(() => {
        setTitleDraft(flow.name);
        setIsEditingTitle(false);
    }, [flow.name]);

    const nodes: Node[] = useMemo(
        () =>
            flow.steps.map((step) => ({
                id: String(step.id),
                type: 'phaseStep',
                position: { x: step.position_x, y: step.position_y },
                data: {
                    name: step.name,
                    description: step.description,
                    canEdit: can.update,
                    onEdit: () => setEditingStep(step),
                    onDelete: () => setDeletingStep(step),
                } satisfies PhaseFlowStepNodeData,
            })),
        [flow.steps, can.update],
    );

    const edges: Edge[] = useMemo(
        () =>
            flow.steps
                .filter((step) => step.next_phase_template_id !== null)
                .map((step) => ({
                    id: `e-${step.id}-${step.next_phase_template_id}`,
                    source: String(step.id),
                    target: String(step.next_phase_template_id),
                    animated: true,
                })),
        [flow.steps],
    );

    function connectSteps(sourceId: number, nextId: number | null) {
        router.patch(
            connect([flow.id, sourceId]).url,
            { next_phase_template_id: nextId },
            {
                preserveScroll: true,
                preserveState: true,
                onError: (errors) => {
                    toast.error(
                        errors.next_phase_template_id ??
                            'Could not connect those steps.',
                    );
                },
            },
        );
    }

    function handleConnect(connection: Connection) {
        if (!connection.source || !connection.target) {
            return;
        }

        connectSteps(Number(connection.source), Number(connection.target));
    }

    function handleEdgesDelete(deleted: Edge[]) {
        deleted.forEach((edge) => connectSteps(Number(edge.source), null));
    }

    function handleNodeDragStop(_event: unknown, node: Node) {
        router.patch(
            updateStep([flow.id, Number(node.id)]).url,
            {
                position_x: Math.round(node.position.x),
                position_y: Math.round(node.position.y),
            },
            { preserveScroll: true, preserveState: true },
        );
    }

    return (
        <>
            <Head title={flow.name} />

            <div className="flex h-[calc(100svh-4rem)] flex-col">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            className="shrink-0"
                        >
                            <Link href={flowsIndex().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">
                                    Back to phase flows
                                </span>
                            </Link>
                        </Button>

                        {isEditingTitle && can.update ? (
                            <input
                                ref={titleInputRef}
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleCommitRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCommitRename();
                                    } else if (e.key === 'Escape') {
                                        handleCancelRename();
                                    }
                                }}
                                aria-label="Phase flow name"
                                className="h-7 min-w-[140px] max-w-sm rounded-md border border-input bg-background px-2 py-0.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                            />
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        onDoubleClick={() => {
                                            if (can.update) {
                                                setIsEditingTitle(true);
                                            }
                                        }}
                                        className={cn(
                                            'min-w-0 truncate rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground transition-colors',
                                            can.update &&
                                                'cursor-pointer hover:bg-muted/60 select-none',
                                        )}
                                    >
                                        {flow.name}
                                    </span>
                                </TooltipTrigger>
                                {can.update && (
                                    <TooltipContent side="bottom">
                                        Double-click to rename
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}

                        <Badge
                            variant={
                                flow.is_ready ? 'secondary' : 'outline'
                            }
                            className="shrink-0 text-xs font-normal"
                        >
                            {flow.is_ready
                                ? 'Ready'
                                : flow.steps.length === 0
                                  ? 'No steps'
                                  : 'Not connected'}
                        </Badge>

                        {flow.description && (
                            <span className="text-muted-foreground hidden max-w-xs truncate text-xs sm:inline-block">
                                · {flow.description}
                            </span>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {can.update && (
                            <Button
                                size="sm"
                                onClick={() => setAddingStep(true)}
                            >
                                <Plus className="size-4" />
                                Add step
                            </Button>
                        )}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">
                                        Flow actions
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                {can.update && (
                                    <>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setIsEditingTitle(true)
                                            }
                                        >
                                            <Pencil className="mr-2 size-4" />
                                            Rename flow
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            onSelect={() =>
                                                setEditingFlowDetails(true)
                                            }
                                        >
                                            <SlidersHorizontal className="mr-2 size-4" />
                                            Edit details
                                        </DropdownMenuItem>
                                    </>
                                )}
                                {can.delete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() =>
                                                setDeletingFlow(true)
                                            }
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete flow
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="min-h-0 flex-1">
                    <ReactFlowProvider>
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            nodeTypes={nodeTypes}
                            onConnect={can.update ? handleConnect : undefined}
                            onEdgesDelete={
                                can.update ? handleEdgesDelete : undefined
                            }
                            onNodeDragStop={
                                can.update ? handleNodeDragStop : undefined
                            }
                            nodesDraggable={can.update}
                            nodesConnectable={can.update}
                            elementsSelectable={can.update}
                            colorMode={resolvedAppearance}
                            fitView
                        >
                            <Background />
                            <Controls />
                            <MiniMap pannable zoomable />
                        </ReactFlow>
                    </ReactFlowProvider>
                </div>
            </div>

            <PhaseFlowRenameDialog
                flowId={flow.id}
                name={flow.name}
                description={flow.description}
                open={editingFlowDetails}
                onOpenChange={setEditingFlowDetails}
            />

            <ConfirmDeleteDialog
                open={deletingFlow}
                onOpenChange={setDeletingFlow}
                title="Delete phase flow?"
                description={
                    <>
                        Are you sure you want to delete{' '}
                        <span className="text-foreground font-medium">
                            {flow.name}
                        </span>{' '}
                        and all of its steps? Projects that already adopted it
                        keep their own copy of its phases.
                    </>
                }
                confirmLabel="Delete flow"
                formAction={destroyFlow.form(flow.id)}
                onSuccess={() => setDeletingFlow(false)}
            />

            <PhaseFlowStepAddDialog
                flowId={flow.id}
                open={addingStep}
                onOpenChange={setAddingStep}
            />

            <PhaseFlowStepEditDialog
                flowId={flow.id}
                step={editingStep}
                onOpenChange={(open) => !open && setEditingStep(null)}
            />

            <ConfirmDeleteDialog
                open={deletingStep !== null}
                onOpenChange={(open) => !open && setDeletingStep(null)}
                title="Delete step?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deletingStep?.name}
                        </span>{' '}
                        from the flow. If it sits in the middle of the chain,
                        its neighbors are reconnected automatically.
                    </>
                }
                confirmLabel="Delete step"
                formAction={
                    deletingStep
                        ? destroyStep.form([flow.id, deletingStep.id])
                        : undefined
                }
                onSuccess={() => setDeletingStep(null)}
            />
        </>
    );
}

function PhaseFlowRenameDialog({
    flowId,
    name,
    description,
    open,
    onOpenChange,
}: {
    flowId: number;
    name: string;
    description: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        name,
        description: description ?? '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        patch(updateFlow(flowId).url, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={open}
            onOpenChange={(next) => !next && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit phase flow</DialogTitle>
                <DialogDescription>
                    Update the name and description of this phase flow template.
                </DialogDescription>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field htmlFor="flow-name" label="Name" error={errors.name}>
                        <Input
                            id="flow-name"
                            defaultValue={name}
                            onChange={(e) => setData('name', e.target.value)}
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
                            defaultValue={description ?? ''}
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
            </DialogContent>
        </Dialog>
    );
}

function PhaseFlowStepAddDialog({
    flowId,
    open,
    onOpenChange,
}: {
    flowId: number;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        description: '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post(storeStep(flowId).url, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogTitle>Add step</DialogTitle>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Field
                        htmlFor="new-step-name"
                        label="Name"
                        error={errors.name}
                    >
                        <Input
                            id="new-step-name"
                            value={data.name}
                            onChange={(e) => setData('name', e.target.value)}
                            autoFocus
                            required
                        />
                    </Field>
                    <Field
                        htmlFor="new-step-description"
                        label="Description"
                        error={errors.description}
                    >
                        <Textarea
                            id="new-step-description"
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
                            Add step
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PhaseFlowStepEditDialog({
    flowId,
    step,
    onOpenChange,
}: {
    flowId: number;
    step: PhaseFlowStepSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { setData, patch, processing, errors, reset } = useForm({
        name: step?.name ?? '',
        description: step?.description ?? '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!step) {
            return;
        }

        patch(updateStep([flowId, step.id]).url, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={step !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit step</DialogTitle>
                {step && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field
                            htmlFor="step-name"
                            label="Name"
                            error={errors.name}
                        >
                            <Input
                                id="step-name"
                                defaultValue={step.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                autoFocus
                            />
                        </Field>
                        <Field
                            htmlFor="step-description"
                            label="Description"
                            error={errors.description}
                        >
                            <Textarea
                                id="step-description"
                                rows={3}
                                defaultValue={step.description ?? ''}
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

EditPhaseFlow.layout = (page: unknown) => {
    const props = page as
        | {
              flow?: PhaseFlowTemplateDetail;
              props?: { flow?: PhaseFlowTemplateDetail };
          }
        | undefined;
    const flow = props?.props?.flow ?? props?.flow;

    return (
        <AppLayout
            breadcrumbs={
                flow
                    ? [
                          { title: 'Phase flows', href: flowsIndex() },
                          { title: flow.name, href: show(flow.id) },
                      ]
                    : [{ title: 'Phase flows', href: flowsIndex() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
