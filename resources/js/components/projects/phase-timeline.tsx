import { router, useForm, usePage } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    FolderOpen,
    MessageCircle,
    Paperclip,
    Reply,
    RotateCcw,
    Sparkles,
    Trash2,
    X,
    XCircle,
} from 'lucide-react';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { EmptyState } from '@/components/empty-state';
import { MentionTextarea } from '@/components/mention-textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useInitials } from '@/hooks/use-initials';
import { fileIconFor, formatBytes } from '@/lib/file-display';
import { cn } from '@/lib/utils';
import { advance } from '@/routes/projects/phases';
import {
    decide,
    destroy,
    resolve,
    resubmit,
    store,
} from '@/routes/projects/phases/activities';
import type {
    PhaseActivitySummary,
    ProjectPhaseSummary,
    ProjectStorageFile,
    TaggableMember,
} from '@/types';

const COMPOSER_TYPES = [
    { value: 'comment', label: 'Comment', icon: MessageCircle },
    { value: 'change_request', label: 'Request', icon: AlertCircle },
] as const;

/**
 * A request's status reads differently depending on whether a reviewer is
 * tagged: with no reviewer it's a plain open/resolved flag; with one, it
 * tracks that reviewer's decision.
 */
function requestStatusLabel(activity: PhaseActivitySummary): string {
    if (activity.reviewer) {
        switch (activity.activity_status) {
            case 'changes_requested':
                return 'Changes Requested';
            case 'resolved':
                return 'Approved';
            default:
                return 'Pending Review';
        }
    }

    return activity.activity_status === 'resolved' ? 'Resolved' : 'Open';
}

/**
 * Status color language used consistently across the badge and the
 * resolve/reopen actions: violet = open/needs a decision, red = changes
 * requested, green = resolved/approved. The badge's icon carries the same
 * signal at a glance, so status reads clearly without a decorative rail
 * down the side of the card.
 */
function requestBadgeClasses(activity: PhaseActivitySummary): string {
    switch (activity.activity_status) {
        case 'changes_requested':
            return 'border-destructive/30 bg-destructive/10 text-destructive';
        case 'resolved':
            return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400';
        default:
            return 'border-chart-2/30 bg-chart-2/10 text-chart-2';
    }
}

function RequestStatusIcon({ activity }: { activity: PhaseActivitySummary }) {
    switch (activity.activity_status) {
        case 'changes_requested':
            return <XCircle className="size-3" />;
        case 'resolved':
            return <CheckCircle2 className="size-3" />;
        default:
            return <AlertCircle className="size-3" />;
    }
}

export function statusLabel(status: string): string {
    return status
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');
}

function formatTime(iso: string): string {
    return new Date(iso).toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
    });
}

function dateKey(iso: string): string {
    return new Date(iso).toDateString();
}

/**
 * The label shown on a date divider between groups of same-day activity -
 * "Today"/"Yesterday" when applicable, otherwise a plain calendar date.
 */
function formatDateDivider(iso: string): string {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    if (dateKey(iso) === today.toDateString()) {
        return 'Today';
    }

    if (dateKey(iso) === yesterday.toDateString()) {
        return 'Yesterday';
    }

    return date.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
    });
}

function DateDivider({ iso }: { iso: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-[11px] font-medium">
                {formatDateDivider(iso)}
            </span>
            <div className="bg-border h-px flex-1" />
        </div>
    );
}

function SystemLine({ activity }: { activity: PhaseActivitySummary }) {
    let text: string;
    let icon = <CheckCircle2 className="size-3.5" />;

    if (activity.type === 'status_changed' && activity.meta) {
        text = `${activity.author.name} changed status to ${statusLabel(activity.meta.to ?? '')}`;
    } else if (activity.type === 'approved') {
        text = `${activity.author.name} approved this phase`;
        icon = <Sparkles className="size-3.5" />;
    } else {
        text = `${activity.author.name} marked the project Completed`;
        icon = <Sparkles className="size-3.5" />;
    }

    return (
        <div className="text-muted-foreground flex items-center justify-center gap-1.5 py-1 text-center text-xs">
            {icon}
            <span>{text}</span>
            <span>&middot;</span>
            <span>{formatTime(activity.created_at)}</span>
        </div>
    );
}

/**
 * An image attachment renders as an inline thumbnail; anything else (PDF,
 * spreadsheet, archive, ...) renders as a compact file card with an icon
 * matched to its type - both link out to the download route.
 */
function AttachmentPreview({
    attachment,
}: {
    attachment: NonNullable<PhaseActivitySummary['attachment']>;
}) {
    if (attachment.mime_type?.startsWith('image/')) {
        return (
            <a
                href={attachment.download_url}
                target="_blank"
                rel="noopener noreferrer"
                className="block max-w-[220px] overflow-hidden rounded-xl"
            >
                <img
                    src={attachment.download_url}
                    alt={attachment.name}
                    className="max-h-52 w-full object-cover"
                />
            </a>
        );
    }

    const Icon = fileIconFor(attachment.mime_type);

    return (
        <a
            href={attachment.download_url}
            className="bg-background hover:border-foreground/20 flex max-w-[220px] items-center gap-2 rounded-xl border px-2.5 py-2 text-xs"
        >
            <Icon className="text-muted-foreground size-5 shrink-0" />
            <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                    {attachment.name}
                </span>
                <span className="text-muted-foreground block">
                    {formatBytes(attachment.size)}
                </span>
            </span>
        </a>
    );
}

function ActivityCard({
    activity,
    projectId,
    phaseId,
    canManage,
    currentUserId,
    projectMembers,
    depth = 0,
}: {
    activity: PhaseActivitySummary;
    projectId: number;
    phaseId: number;
    canManage: boolean;
    currentUserId: number;
    projectMembers: TaggableMember[];
    depth?: number;
}) {
    const [replying, setReplying] = useState(false);
    const [deciding, setDeciding] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [note, setNote] = useState('');
    const getInitials = useInitials();
    const { data, setData, post, processing, reset } = useForm({
        type: 'comment',
        body: '',
        parent_id: activity.id as number | null,
    });

    function submitReply(event: FormEvent) {
        event.preventDefault();

        post(store([projectId, phaseId]).url, {
            preserveScroll: true,
            onSuccess: () => {
                setReplying(false);
                reset();
            },
        });
    }

    function toggleResolved() {
        router.patch(
            resolve([projectId, phaseId, activity.id]).url,
            undefined,
            {
                preserveScroll: true,
            },
        );
    }

    function decideReview(decision: 'approved' | 'changes_requested') {
        router.patch(
            decide([projectId, phaseId, activity.id]).url,
            { decision, note },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDeciding(false);
                    setNote('');
                },
            },
        );
    }

    function resubmitReview() {
        router.post(
            resubmit([projectId, phaseId, activity.id]).url,
            undefined,
            {
                preserveScroll: true,
            },
        );
    }

    const isRequest = activity.type === 'change_request';
    const isResolved = activity.activity_status === 'resolved';
    const isOwn = activity.author.id === currentUserId;
    const isReviewer = activity.reviewer?.id === currentUserId;
    const canToggleResolved =
        isRequest && canManage && (isResolved || !activity.reviewer);
    const canDecideReview =
        isRequest &&
        activity.reviewer !== null &&
        activity.activity_status === 'open' &&
        (isReviewer || canManage);
    const canResubmitReview =
        isRequest &&
        activity.activity_status === 'changes_requested' &&
        (isOwn || canManage);

    const indentClasses =
        depth > 0 ? 'border-border/60 ml-4 border-l pl-3.5' : '';

    return (
        <div className={cn('flex gap-2.5 py-0.5 pr-2', indentClasses)}>
            {!isOwn && (
                <Avatar size="sm" className="mt-0.5 shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {getInitials(activity.author.name)}
                    </AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    'flex min-w-0 flex-1 flex-col space-y-1',
                    isOwn && 'items-end',
                )}
            >
                <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-sm font-medium">
                        {isOwn ? 'You' : activity.author.name}
                    </span>

                    {isRequest && (
                        <Badge
                            variant="outline"
                            className={requestBadgeClasses(activity)}
                        >
                            <RequestStatusIcon activity={activity} />
                            {requestStatusLabel(activity)}
                        </Badge>
                    )}

                    <span className="text-muted-foreground text-xs">
                        {formatTime(activity.created_at)}
                    </span>
                </div>

                {isRequest && activity.reviewer && (
                    <p className="text-muted-foreground text-xs">
                        Reviewer: {activity.reviewer.name}
                    </p>
                )}

                {activity.body && (
                    <div
                        className={cn(
                            'rounded-2xl px-3 py-1.5 text-sm whitespace-pre-wrap',
                            isOwn
                                ? 'max-w-[85%] bg-neutral-600 text-white'
                                : 'max-w-[65%] self-start bg-muted',
                        )}
                    >
                        {activity.body}
                    </div>
                )}

                {activity.attachment && (
                    <AttachmentPreview attachment={activity.attachment} />
                )}

                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1 pt-0.5 text-xs">
                    {depth === 0 && (
                        <button
                            type="button"
                            onClick={() => setReplying((v) => !v)}
                            className="hover:text-foreground flex items-center gap-1"
                        >
                            <Reply className="size-3" />
                            Reply
                        </button>
                    )}
                    {canToggleResolved && (
                        <button
                            type="button"
                            onClick={toggleResolved}
                            className={cn(
                                'flex items-center gap-1 font-medium',
                                isResolved
                                    ? 'text-chart-2 hover:text-chart-2/80'
                                    : 'text-emerald-600 hover:text-emerald-700 dark:text-emerald-400',
                            )}
                        >
                            {isResolved ? (
                                <RotateCcw className="size-3" />
                            ) : (
                                <CheckCircle2 className="size-3" />
                            )}
                            {isResolved ? 'Reopen' : 'Mark resolved'}
                        </button>
                    )}
                    {canDecideReview && (
                        <button
                            type="button"
                            onClick={() => setDeciding((v) => !v)}
                            className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                        >
                            <AlertCircle className="size-3" />
                            Review this
                        </button>
                    )}
                    {canResubmitReview && (
                        <button
                            type="button"
                            onClick={resubmitReview}
                            className="text-primary hover:text-primary/80 flex items-center gap-1 font-medium"
                        >
                            <RotateCcw className="size-3" />
                            Resubmit for review
                        </button>
                    )}
                    {isOwn && (
                        <button
                            type="button"
                            onClick={() => setDeleting(true)}
                            className="hover:text-destructive flex items-center gap-1"
                        >
                            <Trash2 className="size-3" />
                            Delete
                        </button>
                    )}
                </div>

                {deciding && (
                    <div className="max-w-md space-y-2 pt-1">
                        <Textarea
                            rows={2}
                            placeholder="Add a note (required if requesting changes)..."
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setDeciding(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={note.trim() === ''}
                                onClick={() =>
                                    decideReview('changes_requested')
                                }
                            >
                                <XCircle className="size-3.5" />
                                Request changes
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                onClick={() => decideReview('approved')}
                            >
                                <CheckCircle2 className="size-3.5" />
                                Approve
                            </Button>
                        </div>
                    </div>
                )}

                {replying && (
                    <form
                        onSubmit={submitReply}
                        className="max-w-md space-y-2 pt-1"
                    >
                        <MentionTextarea
                            rows={2}
                            placeholder="Write a reply... (@ to mention someone)"
                            value={data.body}
                            onChange={(body) => setData('body', body)}
                            members={projectMembers}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => setReplying(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={processing || data.body.trim() === ''}
                            >
                                Reply
                            </Button>
                        </div>
                    </form>
                )}

                {activity.replies.length > 0 && (
                    <div className="space-y-3 pt-2">
                        {activity.replies.map((reply) => (
                            <ActivityCard
                                key={reply.id}
                                activity={reply}
                                projectId={projectId}
                                phaseId={phaseId}
                                canManage={canManage}
                                currentUserId={currentUserId}
                                projectMembers={projectMembers}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}

                {isOwn && (
                    <ConfirmDeleteDialog
                        open={deleting}
                        onOpenChange={setDeleting}
                        title="Delete this message?"
                        description={
                            activity.replies.length > 0
                                ? 'This removes it along with every reply underneath it. This can’t be undone.'
                                : 'This can’t be undone.'
                        }
                        formAction={destroy.form([
                            projectId,
                            phaseId,
                            activity.id,
                        ])}
                    />
                )}
            </div>
        </div>
    );
}

function AttachExistingFileDialog({
    open,
    onOpenChange,
    files,
    onSelect,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    files: ProjectStorageFile[];
    onSelect: (file: ProjectStorageFile) => void;
}) {
    const [query, setQuery] = useState('');
    const filtered = files.filter((file) =>
        file.name.toLowerCase().includes(query.trim().toLowerCase()),
    );

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[70vh] flex-col">
                <DialogTitle>Attach a file from project storage</DialogTitle>

                {files.length > 0 && (
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search files..."
                        autoFocus
                    />
                )}

                <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
                    {files.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No files have been uploaded to this project yet.
                        </p>
                    ) : filtered.length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                            No files match &ldquo;{query}&rdquo;.
                        </p>
                    ) : (
                        filtered.map((file) => {
                            const Icon = fileIconFor(file.mime_type);

                            return (
                                <button
                                    key={file.id}
                                    type="button"
                                    onClick={() => {
                                        onSelect(file);
                                        onOpenChange(false);
                                    }}
                                    className="hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm"
                                >
                                    <Icon className="text-muted-foreground size-4 shrink-0" />
                                    <span className="min-w-0 flex-1">
                                        <span className="block truncate font-medium">
                                            {file.name}
                                        </span>
                                        <span className="text-muted-foreground block truncate text-xs">
                                            {file.folder_path ?? 'Root'}
                                            {' · '}
                                            {formatBytes(file.size)}
                                        </span>
                                    </span>
                                </button>
                            );
                        })
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function Composer({
    projectId,
    phaseId,
    projectMembers,
    projectFiles,
}: {
    projectId: number;
    phaseId: number;
    projectMembers: TaggableMember[];
    projectFiles: ProjectStorageFile[];
}) {
    const [pickerOpen, setPickerOpen] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'comment' as 'comment' | 'change_request',
        body: '',
        reviewer_id: '' as number | '',
        attachment: null as File | null,
        attachment_id: null as number | null,
    });

    const selectedExistingFile = projectFiles.find(
        (file) => file.id === data.attachment_id,
    );

    function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
        setData((current) => ({
            ...current,
            attachment: event.target.files?.[0] ?? null,
            attachment_id: null,
        }));
    }

    function handlePickExisting(file: ProjectStorageFile) {
        setData((current) => ({
            ...current,
            attachment: null,
            attachment_id: file.id,
        }));
    }

    function clearAttachment() {
        setData((current) => ({
            ...current,
            attachment: null,
            attachment_id: null,
        }));
    }

    function handleSubmit(event: FormEvent) {
        event.preventDefault();

        post(store([projectId, phaseId]).url, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => reset(),
        });
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-2">
            <div className="bg-muted inline-flex items-center gap-0.5 rounded-full p-0.5">
                {COMPOSER_TYPES.map((option) => (
                    <Tooltip key={option.value}>
                        <TooltipTrigger asChild>
                            <button
                                type="button"
                                aria-label={option.label}
                                aria-pressed={data.type === option.value}
                                onClick={() => setData('type', option.value)}
                                className={cn(
                                    'flex size-7 items-center justify-center rounded-full transition-colors',
                                    data.type === option.value
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                <option.icon className="size-3.5" />
                            </button>
                        </TooltipTrigger>
                        <TooltipContent side="top">
                            {option.label}
                        </TooltipContent>
                    </Tooltip>
                ))}
            </div>
            <p className="text-muted-foreground text-xs">
                {data.type === 'comment' &&
                    'General discussion, feedback, or a status update - purely informational, nothing to resolve.'}
                {data.type === 'change_request' &&
                    (data.reviewer_id
                        ? "Tag someone to formally approve or request changes - stays open until they approve."
                        : 'Flags something that must change before this phase can move forward - stays open until a manager marks it resolved, or assign a reviewer below to require their sign-off.')}
            </p>

            {data.type === 'change_request' && (
                <Select
                    value={data.reviewer_id ? String(data.reviewer_id) : 'none'}
                    onValueChange={(value) =>
                        setData(
                            'reviewer_id',
                            value === 'none' ? '' : Number(value),
                        )
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Assign a reviewer (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">No reviewer</SelectItem>
                        {projectMembers.map((member) => (
                            <SelectItem
                                key={member.id}
                                value={String(member.id)}
                            >
                                {member.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            )}
            {errors.reviewer_id && (
                <p className="text-destructive text-xs">{errors.reviewer_id}</p>
            )}

            <MentionTextarea
                rows={3}
                placeholder={
                    data.type === 'comment'
                        ? 'Share an update or ask a question... (@ to mention someone)'
                        : 'Describe what needs to change or be reviewed... (@ to mention someone)'
                }
                value={data.body}
                onChange={(body) => setData('body', body)}
                members={projectMembers}
            />

            <div className="flex items-center justify-between gap-2">
                {data.attachment || selectedExistingFile ? (
                    <div className="text-muted-foreground flex min-w-0 items-center gap-1.5 text-xs">
                        <Paperclip className="size-3.5 shrink-0" />
                        <span className="max-w-40 truncate">
                            {data.attachment?.name ??
                                selectedExistingFile?.name}
                        </span>
                        <button
                            type="button"
                            onClick={clearAttachment}
                            className="hover:text-foreground shrink-0"
                        >
                            <X className="size-3.5" />
                            <span className="sr-only">Remove attachment</span>
                        </button>
                    </div>
                ) : (
                    <div className="flex items-center gap-3">
                        <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs hover:underline">
                            <Paperclip className="size-3.5" />
                            Attach file
                            <input
                                type="file"
                                className="hidden"
                                onChange={handleAttachmentChange}
                            />
                        </label>
                        <button
                            type="button"
                            onClick={() => setPickerOpen(true)}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1.5 text-xs hover:underline"
                        >
                            <FolderOpen className="size-3.5" />
                            From project files
                        </button>
                    </div>
                )}
                <Button
                    type="submit"
                    size="sm"
                    disabled={processing || data.body.trim() === ''}
                >
                    Send
                </Button>
            </div>
            {errors.body && (
                <p className="text-destructive text-xs">{errors.body}</p>
            )}

            <AttachExistingFileDialog
                open={pickerOpen}
                onOpenChange={setPickerOpen}
                files={projectFiles}
                onSelect={handlePickExisting}
            />
        </form>
    );
}

type TimelinePhase = Pick<
    ProjectPhaseSummary,
    'id' | 'status' | 'open_change_requests_count'
>;

export function PhaseTimeline({
    projectId,
    phase,
    activities,
    canManage,
    nextPhaseName,
    projectMembers,
    projectFiles,
}: {
    projectId: number;
    phase: TimelinePhase;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    projectMembers: TaggableMember[];
    projectFiles: ProjectStorageFile[];
}) {
    const currentUserId = usePage().props.auth.user.id;

    function advancePhase() {
        router.post(
            advance([projectId, phase.id]).url,
            {},
            { preserveScroll: true },
        );
    }

    function postApproval() {
        router.post(
            store([projectId, phase.id]).url,
            { type: 'approval' },
            { preserveScroll: true },
        );
    }

    const hasOpenChangeRequests = phase.open_change_requests_count > 0;
    const hasApproval = activities.some((a) => a.type === 'approved');

    let lastDateKey: string | null = null;

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="min-h-0 flex-1 space-y-2 overflow-auto p-3">
                {activities.length === 0 ? (
                    <EmptyState
                        icon={MessageCircle}
                        message="No activity yet. Start the conversation below."
                    />
                ) : (
                    activities.map((activity) => {
                        const key = dateKey(activity.created_at);
                        const showDivider = key !== lastDateKey;
                        lastDateKey = key;

                        return (
                            <div key={activity.id} className="space-y-2">
                                {showDivider && (
                                    <DateDivider iso={activity.created_at} />
                                )}
                                {activity.type === 'comment' ||
                                activity.type === 'change_request' ? (
                                    <ActivityCard
                                        activity={activity}
                                        projectId={projectId}
                                        phaseId={phase.id}
                                        canManage={canManage}
                                        currentUserId={currentUserId}
                                        projectMembers={projectMembers}
                                    />
                                ) : (
                                    <SystemLine activity={activity} />
                                )}
                            </div>
                        );
                    })
                )}
            </div>

            <div className="border-t p-3">
                <Composer
                    projectId={projectId}
                    phaseId={phase.id}
                    projectMembers={projectMembers}
                    projectFiles={projectFiles}
                />
            </div>

            {canManage && phase.status !== 'completed' && (
                <div className="bg-muted/40 border-t px-3 py-2.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-muted-foreground text-xs">
                            {hasOpenChangeRequests &&
                                `${phase.open_change_requests_count} change request(s) still open. `}
                            {hasApproval
                                ? 'Approved - ready to advance.'
                                : 'No approval posted yet.'}
                        </p>
                        <div className="ml-auto flex shrink-0 items-center gap-2">
                            {!hasApproval && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={postApproval}
                                >
                                    <CheckCircle2 className="size-3.5" />
                                    Approve
                                </Button>
                            )}
                            <Button
                                type="button"
                                size="sm"
                                onClick={advancePhase}
                            >
                                {nextPhaseName
                                    ? `Move to ${nextPhaseName}`
                                    : 'Mark project Completed'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
