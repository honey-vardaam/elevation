import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import {
    AlertTriangle,
    ChevronDown,
    Circle,
    CircleCheck,
    CircleDot,
    Eye,
    GripVertical,
    MessageSquare,
    MoreHorizontal,
    Plus,
    RefreshCw,
    Users,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Field } from '@/components/field';
import { SortableList } from '@/components/sortable-list';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { destroy, reorder, store, update } from '@/routes/projects/phases';
import type {
    ProjectPhaseStatus,
    ProjectPhaseSummary,
    PhaseActivityPreview,
} from '@/types';

const PHASE_STATUSES: { value: ProjectPhaseStatus; label: string }[] = [
    { value: 'pending', label: 'Pending' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
];

/**
 * No color, no borders, no fills - just three steps of icon weight from
 * faint to solid, matching how the rest of the app already leans on
 * text-foreground/text-muted-foreground for emphasis. Nothing decorative
 * added to the card itself.
 */
const PHASE_STATUS_ICON_STYLE: Record<ProjectPhaseStatus, string> = {
    completed: 'text-foreground',
    in_progress: 'text-foreground/60',
    pending: 'text-muted-foreground/40',
};

function phaseStatusLabel(status: ProjectPhaseStatus): string {
    return PHASE_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function PhaseStatusIcon({ status }: { status: ProjectPhaseStatus }) {
    const className = cn('size-4 shrink-0', PHASE_STATUS_ICON_STYLE[status]);

    if (status === 'completed') {
        return <CircleCheck className={className} />;
    }
    if (status === 'in_progress') {
        return <CircleDot className={className} />;
    }
    return <Circle className={className} />;
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function PhaseActivityPreviewRow({
    activity,
}: {
    activity: PhaseActivityPreview;
}) {
    return (
        <li className="flex items-start gap-2 text-xs">
            <PhaseActivityIcon
                type={activity.type}
                className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
            />
            <p className="text-muted-foreground min-w-0">
                <span className="text-foreground font-medium">
                    {activity.author.name}
                </span>{' '}
                {activity.preview}
                {activity.attachment_name && (
                    <span className="text-foreground">
                        {' '}
                        · {activity.attachment_name}
                    </span>
                )}
                <span className="block">
                    {formatDateTime(activity.created_at)}
                </span>
            </p>
        </li>
    );
}

function PhaseActivityIcon({
    type,
    className,
}: {
    type: string;
    className?: string;
}) {
    switch (type) {
        case 'change_request':
            return <AlertTriangle className={className} />;
        case 'review':
            return <Eye className={className} />;
        case 'status_changed':
            return <RefreshCw className={className} />;
        case 'approved':
        case 'project_completed':
            return <CircleCheck className={className} />;
        default:
            return <MessageSquare className={className} />;
    }
}

export function ProjectPhases({
    projectId,
    phases,
    availablePhaseTemplates,
    teams,
    canManage,
    activePhaseId,
    onOpenPhase,
    onClosePhase,
}: {
    projectId: number;
    phases: ProjectPhaseSummary[];
    availablePhaseTemplates: { id: number; name: string }[];
    teams: { id: number; name: string }[];
    canManage: boolean;
    activePhaseId: number | null;
    onOpenPhase: (phaseId: number) => void;
    onClosePhase: () => void;
}) {
    const [editing, setEditing] = useState<ProjectPhaseSummary | null>(null);
    const [deleting, setDeleting] = useState<ProjectPhaseSummary | null>(null);
    const [expandedPhaseId, setExpandedPhaseId] = useState<number | null>(null);
    const [phasesOpen, setPhasesOpen] = useState(true);

    if (phases.length === 0 && !canManage) {
        return null;
    }

    function handleReorder(ids: number[]) {
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

    const completedCount = phases.filter(
        (p) => p.status === 'completed',
    ).length;
    const progressPercent =
        phases.length > 0
            ? Math.round((completedCount / phases.length) * 100)
            : 0;

    return (
        <Collapsible
            open={phasesOpen}
            onOpenChange={setPhasesOpen}
            className="bg-muted/40 space-y-4 rounded-xl border p-4"
        >
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <CollapsibleTrigger asChild>
                        <button
                            type="button"
                            className="group/phases-toggle flex items-center gap-1.5 text-sm font-medium"
                        >
                            <ChevronDown className="text-muted-foreground size-4 transition-transform group-data-[state=closed]/phases-toggle:-rotate-90" />
                            Phases
                        </button>
                    </CollapsibleTrigger>
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

                {phases.length > 0 && (
                    <div className="space-y-1.5">
                        <p className="text-xs">
                            <span className="text-foreground font-medium">
                                {completedCount} of {phases.length} completed
                            </span>
                            <span className="text-muted-foreground">
                                {' '}
                                · {progressPercent}%
                            </span>
                        </p>
                        <div className="bg-border h-1 w-full overflow-hidden rounded-full">
                            <div
                                className="bg-foreground h-full rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            <CollapsibleContent className="space-y-2">
                {phases.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                        No phases yet.
                    </p>
                ) : (
                    <SortableList
                        items={phases}
                        onReorder={handleReorder}
                        disabled={!canManage}
                        className="space-y-2"
                        renderItem={(phase, _index, { handle, isDragging }) => (
                            <Collapsible
                                open={expandedPhaseId === phase.id}
                                onOpenChange={(open) =>
                                    setExpandedPhaseId(open ? phase.id : null)
                                }
                                className={cn(
                                    'group/phase bg-card rounded-lg border p-3 transition-all',
                                    phase.id === activePhaseId &&
                                        'border-primary bg-primary/5',
                                    isDragging && 'scale-[1.02] shadow-lg',
                                )}
                            >
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                    <div className="flex min-w-0 items-center gap-3">
                                        {canManage && (
                                            <button
                                                type="button"
                                                ref={handle.ref}
                                                {...handle.attributes}
                                                {...handle.listeners}
                                                className="text-muted-foreground hover:text-foreground cursor-grab touch-none active:cursor-grabbing"
                                            >
                                                <GripVertical className="size-4" />
                                                <span className="sr-only">
                                                    Drag to reorder
                                                </span>
                                            </button>
                                        )}
                                        <PhaseStatusIcon
                                            status={phase.status}
                                        />
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {phase.name}
                                            </p>
                                            <div className="text-muted-foreground mt-0.5 flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-xs">
                                                {(phase.start_date ||
                                                    phase.end_date) && (
                                                    <span>
                                                        {phase.start_date}
                                                        {phase.end_date &&
                                                            ` – ${phase.end_date}`}
                                                    </span>
                                                )}
                                                {phase.duration && (
                                                    <span>
                                                        {phase.duration}
                                                    </span>
                                                )}
                                                {phase.team && (
                                                    <span className="inline-flex items-center gap-1">
                                                        <Users className="size-3" />
                                                        {phase.team.name}
                                                    </span>
                                                )}
                                                <span className="inline-flex items-center gap-1">
                                                    <MessageSquare className="size-3" />
                                                    {phase.comments_count}
                                                </span>
                                                <span className="inline-flex items-center gap-1">
                                                    <AlertTriangle className="size-3" />
                                                    {
                                                        phase.change_requests_count
                                                    }
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex shrink-0 items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon-sm"
                                            className={cn(
                                                'relative',
                                                phase.id === activePhaseId &&
                                                    'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary',
                                            )}
                                            onClick={() =>
                                                phase.id === activePhaseId
                                                    ? onClosePhase()
                                                    : onOpenPhase(phase.id)
                                            }
                                        >
                                            <MessageSquare className="size-4" />
                                            <span className="sr-only">
                                                {phase.id === activePhaseId
                                                    ? 'Close collaboration panel'
                                                    : 'Collaborate'}
                                            </span>
                                            {phase.open_change_requests_count >
                                                0 && (
                                                <Badge
                                                    variant="destructive"
                                                    className="absolute -top-1 -right-1 h-4 min-w-4 justify-center rounded-full px-1 text-[10px]"
                                                >
                                                    {
                                                        phase.open_change_requests_count
                                                    }
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
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon-sm"
                                                    >
                                                        <MoreHorizontal className="size-4" />
                                                        <span className="sr-only">
                                                            Phase actions
                                                        </span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onSelect={() =>
                                                            setEditing(phase)
                                                        }
                                                    >
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        variant="destructive"
                                                        onSelect={() =>
                                                            setDeleting(phase)
                                                        }
                                                    >
                                                        Delete
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                        <CollapsibleTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                className="group-data-[state=open]/phase:rotate-180"
                                            >
                                                <ChevronDown className="size-4" />
                                                <span className="sr-only">
                                                    Toggle phase notes
                                                </span>
                                            </Button>
                                        </CollapsibleTrigger>
                                    </div>
                                </div>

                                <CollapsibleContent>
                                    <div className="border-border/60 mt-3 border-t pt-3 text-sm">
                                        {phase.notes ? (
                                            <p className="text-muted-foreground whitespace-pre-wrap">
                                                {phase.notes}
                                            </p>
                                        ) : (
                                            <p className="text-muted-foreground italic">
                                                No notes for this phase.
                                            </p>
                                        )}
                                    </div>

                                    {phase.recent_activity.length > 0 && (
                                        <div className="border-border/60 mt-3 border-t pt-3">
                                            <p className="text-muted-foreground mb-2 text-xs font-medium">
                                                Recent activity
                                            </p>
                                            <ul className="space-y-2">
                                                {phase.recent_activity.map(
                                                    (activity) => (
                                                        <PhaseActivityPreviewRow
                                                            key={activity.id}
                                                            activity={activity}
                                                        />
                                                    ),
                                                )}
                                            </ul>
                                        </div>
                                    )}
                                </CollapsibleContent>
                            </Collapsible>
                        )}
                    />
                )}
            </CollapsibleContent>

            <PhaseEditDialog
                projectId={projectId}
                phase={editing}
                teams={teams}
                onOpenChange={(open) => !open && setEditing(null)}
            />

            <ConfirmDeleteDialog
                open={deleting !== null}
                onOpenChange={(open) => !open && setDeleting(null)}
                title="Remove phase?"
                description={
                    <>
                        This removes{' '}
                        <span className="text-foreground font-medium">
                            {deleting?.name}
                        </span>{' '}
                        from this project.
                    </>
                }
                confirmLabel="Remove"
                formAction={
                    deleting
                        ? destroy.form([projectId, deleting.id])
                        : undefined
                }
                onSuccess={() => setDeleting(null)}
            />
        </Collapsible>
    );
}

function PhaseEditDialog({
    projectId,
    phase,
    teams,
    onOpenChange,
}: {
    projectId: number;
    phase: ProjectPhaseSummary | null;
    teams: { id: number; name: string }[];
    onOpenChange: (open: boolean) => void;
}) {
    const { data, setData, patch, processing, errors, reset } = useForm({
        status: phase?.status ?? 'pending',
        start_date: phase?.start_date ?? '',
        end_date: phase?.end_date ?? '',
        notes: phase?.notes ?? '',
        team_id: phase?.team?.id ?? (null as number | null),
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
                            <Field
                                htmlFor="phase-start-date"
                                label="Start date"
                                error={errors.start_date}
                            >
                                <Input
                                    id="phase-start-date"
                                    type="date"
                                    value={data.start_date ?? ''}
                                    onChange={(e) =>
                                        setData('start_date', e.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                htmlFor="phase-end-date"
                                label="End date"
                                error={errors.end_date}
                            >
                                <Input
                                    id="phase-end-date"
                                    type="date"
                                    value={data.end_date ?? ''}
                                    onChange={(e) =>
                                        setData('end_date', e.target.value)
                                    }
                                />
                            </Field>
                        </div>
                        <Field
                            htmlFor="phase-team"
                            label="Assigned team"
                            error={errors.team_id}
                        >
                            <Select
                                value={
                                    data.team_id === null
                                        ? 'none'
                                        : String(data.team_id)
                                }
                                onValueChange={(value) =>
                                    setData(
                                        'team_id',
                                        value === 'none' ? null : Number(value),
                                    )
                                }
                            >
                                <SelectTrigger id="phase-team">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">
                                        No team
                                    </SelectItem>
                                    {teams.map((team) => (
                                        <SelectItem
                                            key={team.id}
                                            value={String(team.id)}
                                        >
                                            {team.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </Field>
                        <Field
                            htmlFor="phase-notes"
                            label="Notes"
                            error={errors.notes}
                        >
                            <Textarea
                                id="phase-notes"
                                rows={3}
                                value={data.notes ?? ''}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
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
