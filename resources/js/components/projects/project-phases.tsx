import { router, useForm } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import {
    AlertCircle,
    Calendar,
    Check,
    MessageSquare,
    MoreHorizontal,
    Plus,
    Users,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
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
import { destroy, store, update } from '@/routes/projects/phases';
import type { ProjectPhaseStatus, ProjectPhaseSummary } from '@/types';

const PHASE_STATUSES: { value: ProjectPhaseStatus; label: string }[] = [
    { value: 'pending', label: 'Mark Pending' },
    { value: 'in_progress', label: 'Mark In Progress' },
    { value: 'completed', label: 'Mark Completed' },
];

function phaseStatusLabel(status: ProjectPhaseStatus): string {
    switch (status) {
        case 'completed':
            return 'Completed';
        case 'in_progress':
            return 'In Progress';
        case 'pending':
        default:
            return 'Pending';
    }
}

export function ProjectPhases({
    projectId,
    phases,
    availablePhaseTemplates,
    teams,
    canManage,
    currentPhaseId,
    onSelectPhase,
    className,
    style,
}: {
    projectId: number;
    phases: ProjectPhaseSummary[];
    availablePhaseTemplates: { id: number; name: string }[];
    teams: { id: number; name: string }[];
    canManage: boolean;
    currentPhaseId?: number | null;
    onSelectPhase?: (phaseId: number) => void;
    className?: string;
    style?: React.CSSProperties;
}) {
    const [editing, setEditing] = useState<ProjectPhaseSummary | null>(null);
    const [deleting, setDeleting] = useState<ProjectPhaseSummary | null>(null);

    if (phases.length === 0 && !canManage) {
        return null;
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
                team_id: phase.team?.id ?? null,
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

    return (
        <div
            className={cn(
                'bg-muted/40 flex flex-col rounded-xl border p-3 shadow-xs overflow-hidden w-full',
                className,
            )}
            style={style}
        >
            <div className="flex items-center justify-between gap-2 shrink-0 pb-2.5 border-b">
                <div>
                    <h3 className="text-sm font-semibold tracking-tight">
                        Phase Flow
                    </h3>
                    <p className="text-muted-foreground text-xs">
                        {phases.filter((p) => p.status === 'completed').length}{' '}
                        of {phases.length} completed
                    </p>
                </div>
                {canManage && availablePhaseTemplates.length > 0 && (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-6 gap-1 text-[11px] px-2"
                            >
                                <Plus className="size-3" />
                                Add
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
                <div className="flex flex-1 items-center justify-center py-6 text-center text-muted-foreground text-sm">
                    No phases yet.
                </div>
            ) : (
                <div className="flex-1 min-h-0 overflow-y-auto pt-2.5 px-0.5">
                    {phases.map((phase, index) => (
                        <VerticalPhaseStep
                            key={phase.id}
                            phase={phase}
                            canManage={canManage}
                            isSelected={currentPhaseId === phase.id}
                            isLast={index === phases.length - 1}
                            onSelect={
                                onSelectPhase
                                    ? () => onSelectPhase(phase.id)
                                    : undefined
                            }
                            onEdit={() => setEditing(phase)}
                            onDelete={() => setDeleting(phase)}
                            onChangeStatus={(status) =>
                                changeStatus(phase, status)
                            }
                        />
                    ))}
                </div>
            )}

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
        </div>
    );
}

function VerticalPhaseStep({
    phase,
    canManage,
    isSelected,
    isLast,
    onSelect,
    onEdit,
    onDelete,
    onChangeStatus,
}: {
    phase: ProjectPhaseSummary;
    canManage: boolean;
    isSelected: boolean;
    isLast: boolean;
    onSelect?: () => void;
    onEdit: () => void;
    onDelete: () => void;
    onChangeStatus: (status: ProjectPhaseStatus) => void;
}) {
    const isActive = phase.status === 'in_progress';
    const isCompleted = phase.status === 'completed';

    return (
        <div className="relative flex items-stretch gap-2 min-w-0">
            {/* Timeline track: node circle + connector line */}
            <div className="flex flex-col items-center pt-2">
                <button
                    type="button"
                    onClick={onSelect}
                    className={cn(
                        'flex size-4 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring z-10 bg-background',
                        isCompleted &&
                            'border-foreground bg-foreground text-background',
                        isActive &&
                            'border-primary bg-background text-primary ring-2 ring-primary/25',
                        !isCompleted &&
                            !isActive &&
                            'border-muted-foreground/40 text-muted-foreground/50 hover:border-foreground/60',
                    )}
                    title={`${phaseStatusLabel(phase.status)}${onSelect ? ' — click to view conversation' : ''}`}
                >
                    {isCompleted ? (
                        <Check className="size-2.5 stroke-[2.5]" />
                    ) : isActive ? (
                        <span className="size-1.5 rounded-full bg-primary" />
                    ) : null}
                </button>

                {!isLast && (
                    <div
                        className={cn(
                            'w-0.5 flex-1 min-h-4 my-1 transition-colors',
                            isCompleted ? 'bg-foreground' : 'bg-border',
                        )}
                    />
                )}
            </div>

            {/* Step card */}
            <div
                onClick={onSelect}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onSelect?.();
                    }
                }}
                className={cn(
                    'group/step flex-1 min-w-0 cursor-pointer rounded-xl border p-2.5 transition-all text-left mb-2 outline-none select-none',
                    isSelected
                        ? 'bg-accent/80 border-primary/50 shadow-xs ring-1 ring-primary/30'
                        : 'bg-card/70 hover:bg-muted/40 hover:border-border/80',
                )}
            >
                <div className="flex items-start justify-between gap-1.5 min-w-0">
                    <div className="min-w-0 flex-1">
                        <span
                            className={cn(
                                'block text-sm font-medium tracking-tight truncate',
                                isSelected && 'text-foreground font-semibold',
                            )}
                            title={phase.name}
                        >
                            {phase.name}
                        </span>

                        <div className="flex items-center gap-1.5 mt-1">
                            <Badge
                                variant={
                                    isCompleted
                                        ? 'default'
                                        : isActive
                                          ? 'secondary'
                                          : 'outline'
                                }
                                className="text-[10px] px-1.5 py-0 shrink-0 h-4"
                            >
                                {phaseStatusLabel(phase.status)}
                            </Badge>
                        </div>

                        {(phase.start_date || phase.duration) && (
                            <div className="text-muted-foreground flex items-center gap-1.5 text-xs mt-1">
                                <Calendar className="size-3 shrink-0 opacity-70" />
                                <span className="truncate">
                                    {phase.start_date && phase.end_date
                                        ? `${phase.start_date} – ${phase.end_date}`
                                        : phase.start_date
                                          ? `Starts ${phase.start_date}`
                                          : phase.duration}
                                </span>
                            </div>
                        )}

                        {phase.team && (
                            <div className="text-muted-foreground flex items-center gap-1.5 text-xs mt-0.5">
                                <Users className="size-3 shrink-0 opacity-70" />
                                <span className="truncate">
                                    {phase.team.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {canManage && (
                        <div
                            className="shrink-0 -mr-1 -mt-0.5"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon-xs"
                                        className="text-muted-foreground opacity-60 group-hover/step:opacity-100 data-[state=open]:opacity-100"
                                    >
                                        <MoreHorizontal className="size-3.5" />
                                        <span className="sr-only">
                                            {phase.name} actions
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onSelect={onEdit}>
                                        Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    {PHASE_STATUSES.filter(
                                        (s) => s.value !== phase.status,
                                    ).map((s) => (
                                        <DropdownMenuItem
                                            key={s.value}
                                            onSelect={() =>
                                                onChangeStatus(s.value)
                                            }
                                        >
                                            {s.label}
                                        </DropdownMenuItem>
                                    ))}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={onDelete}
                                    >
                                        Delete
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    )}
                </div>

                {(phase.open_change_requests_count > 0 ||
                    phase.comments_count > 0 ||
                    phase.notes) && (
                    <div className="mt-2 space-y-1 border-t border-border/40 pt-1.5">
                        <div className="flex flex-wrap items-center gap-2 text-[11px]">
                            {phase.open_change_requests_count > 0 && (
                                <span className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                                    <AlertCircle className="size-3" />
                                    {phase.open_change_requests_count} open request
                                    {phase.open_change_requests_count > 1
                                        ? 's'
                                        : ''}
                                </span>
                            )}
                            {phase.comments_count > 0 && (
                                <span className="flex items-center gap-1 text-muted-foreground">
                                    <MessageSquare className="size-3" />
                                    {phase.comments_count} comment
                                    {phase.comments_count > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {phase.notes && (
                            <p className="text-muted-foreground line-clamp-2 text-xs italic">
                                "{phase.notes}"
                            </p>
                        )}
                    </div>
                )}
            </div>
        </div>
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
