import { router, useForm } from '@inertiajs/react';
import { type DragEvent, type FormEvent, useState } from 'react';
import {
    GripVertical,
    MessageSquare,
    Pencil,
    Plus,
    Trash2,
} from 'lucide-react';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogFooter,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { destroy, reorder, store, update } from '@/routes/projects/phases';
import type { ProjectPhaseStatus, ProjectPhaseSummary } from '@/types';

const PHASE_STATUSES: { value: ProjectPhaseStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
];

function phaseStatusLabel(status: ProjectPhaseStatus): string {
    return PHASE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

export function ProjectPhases({
    projectId,
    phases,
    availablePhaseTemplates,
    canManage,
    activePhaseId,
    onOpenPhase,
}: {
    projectId: number;
    phases: ProjectPhaseSummary[];
    availablePhaseTemplates: { id: number; name: string }[];
    canManage: boolean;
    activePhaseId: number | null;
    onOpenPhase: (phaseId: number) => void;
}) {
    const [editing, setEditing] = useState<ProjectPhaseSummary | null>(null);
    const [deleting, setDeleting] = useState<ProjectPhaseSummary | null>(null);
    const [draggedId, setDraggedId] = useState<number | null>(null);
    const [dragOverId, setDragOverId] = useState<number | null>(null);

    if (phases.length === 0 && !canManage) {
        return null;
    }

    function handleDragOver(event: DragEvent, phaseId: number) {
        if (draggedId === null) {
            return;
        }

        event.preventDefault();
        if (dragOverId !== phaseId) {
            setDragOverId(phaseId);
        }
    }

    function handleDrop(event: DragEvent, targetId: number) {
        event.preventDefault();
        setDragOverId(null);

        if (draggedId === null || draggedId === targetId) {
            setDraggedId(null);
            return;
        }

        const ids = phases.map((p) => p.id);
        const fromIndex = ids.indexOf(draggedId);
        const toIndex = ids.indexOf(targetId);
        ids.splice(fromIndex, 1);
        ids.splice(toIndex, 0, draggedId);
        setDraggedId(null);

        router.post(reorder(projectId).url, { ids }, { preserveScroll: true });
    }

    function changeStatus(
        phase: ProjectPhaseSummary,
        status: ProjectPhaseStatus,
    ) {
        router.patch(
            update([projectId, phase.id]).url,
            {
                status,
                start_date: phase.start_date,
                end_date: phase.end_date,
                notes: phase.notes,
            },
            { preserveScroll: true },
        );
    }

    function addPhase(phaseTemplateId: number) {
        router.post(
            store(projectId).url,
            { phase_template_id: phaseTemplateId },
            { preserveScroll: true },
        );
    }

    function removePhase(phase: ProjectPhaseSummary) {
        router.delete(destroy([projectId, phase.id]).url, {
            preserveScroll: true,
        });
    }

    return (
        <div className="space-y-2 rounded-xl border p-4">
            <div className="flex items-center justify-between gap-2">
                <h2 className="text-sm font-medium">Phases</h2>
                {canManage && availablePhaseTemplates.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Plus className="size-4" />
                                Add phase
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {availablePhaseTemplates.map((template) => (
                                <DropdownMenuItem
                                    key={template.id}
                                    onSelect={() => addPhase(template.id)}
                                >
                                    {template.name}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>

            {phases.length === 0 ? (
                <p className="text-muted-foreground text-sm">No phases yet.</p>
            ) : (
                <div className="space-y-2">
                    {phases.map((phase) => (
                        <div
                            key={phase.id}
                            onDragOver={(e) => handleDragOver(e, phase.id)}
                            onDrop={(e) => handleDrop(e, phase.id)}
                            onDragLeave={() =>
                                setDragOverId((current) =>
                                    current === phase.id ? null : current,
                                )
                            }
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 transition-colors ${phase.id === activePhaseId ? 'border-primary' : ''} ${dragOverId === phase.id && draggedId !== phase.id ? 'border-primary bg-primary/5' : ''} ${draggedId === phase.id ? 'opacity-50' : ''}`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {canManage && (
                                    <div
                                        draggable
                                        onDragStart={() =>
                                            setDraggedId(phase.id)
                                        }
                                        onDragEnd={() => {
                                            setDraggedId(null);
                                            setDragOverId(null);
                                        }}
                                        className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                                    >
                                        <GripVertical className="size-4" />
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {phase.name}
                                    </p>
                                    {(phase.start_date || phase.end_date) && (
                                        <p className="text-muted-foreground text-xs">
                                            {phase.start_date}
                                            {phase.end_date &&
                                                ` – ${phase.end_date}`}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <div className="flex shrink-0 items-center gap-1">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => onOpenPhase(phase.id)}
                                >
                                    <MessageSquare className="size-4" />
                                    Collaborate
                                    {phase.open_change_requests_count > 0 && (
                                        <Badge
                                            variant="destructive"
                                            className="ml-1"
                                        >
                                            {phase.open_change_requests_count}
                                        </Badge>
                                    )}
                                </Button>
                                {canManage ? (
                                    <Select
                                        value={phase.status}
                                        onValueChange={(status) =>
                                            changeStatus(
                                                phase,
                                                status as ProjectPhaseStatus,
                                            )
                                        }
                                    >
                                        <SelectTrigger className="h-8 w-fit">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {PHASE_STATUSES.map((s) => (
                                                <SelectItem
                                                    key={s.value}
                                                    value={s.value}
                                                >
                                                    {s.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge variant="secondary">
                                        {phaseStatusLabel(phase.status)}
                                    </Badge>
                                )}
                                {canManage && (
                                    <>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => setEditing(phase)}
                                        >
                                            <Pencil className="size-4" />
                                            <span className="sr-only">
                                                Edit
                                            </span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            onClick={() => setDeleting(phase)}
                                        >
                                            <Trash2 className="size-4" />
                                            <span className="sr-only">
                                                Remove
                                            </span>
                                        </Button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <PhaseEditDialog
                projectId={projectId}
                phase={editing}
                onOpenChange={(open) => !open && setEditing(null)}
            />

            <Dialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
            >
                <DialogContent>
                    <DialogTitle>Remove phase?</DialogTitle>
                    <p className="text-muted-foreground text-sm">
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        from this project.
                    </p>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="secondary">Cancel</Button>
                        </DialogClose>
                        <Button
                            variant="destructive"
                            onClick={() => {
                                if (deleting) {
                                    removePhase(deleting);
                                    setDeleting(null);
                                }
                            }}
                        >
                            Remove
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

function PhaseEditDialog({
    projectId,
    phase,
    onOpenChange,
}: {
    projectId: number;
    phase: ProjectPhaseSummary | null;
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        status: phase?.status ?? 'pending',
        start_date: phase?.start_date ?? '',
        end_date: phase?.end_date ?? '',
        notes: phase?.notes ?? '',
    });

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        if (!phase) {
            return;
        }

        patch(update([projectId, phase.id]).url, {
            preserveScroll: true,
            onSuccess: () => {
                onOpenChange(false);
                reset();
            },
        });
    }

    return (
        <Dialog
            open={phase !== null}
            onOpenChange={(open) => !open && onOpenChange(false)}
        >
            <DialogContent>
                <DialogTitle>Edit phase</DialogTitle>
                {phase && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <p className="text-sm font-medium">{phase.name}</p>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="phase-start-date">
                                    Start date
                                </Label>
                                <Input
                                    id="phase-start-date"
                                    type="date"
                                    value={data.start_date ?? ''}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                />
                                <InputError message={errors.start_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="phase-end-date">End date</Label>
                                <Input
                                    id="phase-end-date"
                                    type="date"
                                    value={data.end_date ?? ''}
                                    onChange={(e) =>
                                        setData('end_date', e.target.value)
                                    }
                                />
                                <InputError message={errors.end_date} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phase-notes">Notes</Label>
                            <Textarea
                                id="phase-notes"
                                rows={3}
                                value={data.notes ?? ''}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                            />
                            <InputError message={errors.notes} />
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
