import { router, useForm, usePage } from '@inertiajs/react';
import { type ChangeEvent, type FormEvent, useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    MessageCircle,
    Paperclip,
    Reply,
    RotateCcw,
    Sparkles,
    UserCheck,
    XCircle,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useInitials } from '@/hooks/use-initials';
import { cn } from '@/lib/utils';
import { advance } from '@/routes/projects/phases';
import {
    decide,
    resolve,
    resubmit,
    store,
} from '@/routes/projects/phases/activities';
import type {
    PhaseActivitySummary,
    ProjectPhaseSummary,
    ReviewStatus,
    TaggableMember,
} from '@/types';

const REVIEW_STATUS_LABEL: Record<ReviewStatus, string> = {
    pending: 'Pending Review',
    changes_requested: 'Changes Requested',
    approved: 'Approved',
};

export function statusLabel(status: string): string {
    return status
        .split('_')
        .map((w) => w[0].toUpperCase() + w.slice(1))
        .join(' ');
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
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
            <span>{formatDate(activity.created_at)}</span>
        </div>
    );
}

function ActivityCard({
    activity,
    projectId,
    phaseId,
    canManage,
    currentUserId,
    depth = 0,
}: {
    activity: PhaseActivitySummary;
    projectId: number;
    phaseId: number;
    canManage: boolean;
    currentUserId: number;
    depth?: number;
}) {
    const [replying, setReplying] = useState(false);
    const [deciding, setDeciding] = useState(false);
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

    const isResolved = activity.resolved_at !== null;
    const isOwn = activity.author.id === currentUserId;
    const isReview = activity.type === 'review';
    const isReviewer = activity.reviewer?.id === currentUserId;
    const canDecideReview =
        isReview &&
        activity.review_status === 'pending' &&
        (isReviewer || canManage);
    const canResubmitReview =
        isReview &&
        activity.review_status === 'changes_requested' &&
        (isOwn || canManage);

    return (
        <div
            className={cn(
                'flex items-end gap-2',
                depth > 0 && 'ml-10',
                isOwn ? 'flex-row-reverse' : 'flex-row',
            )}
        >
            {!isOwn && (
                <Avatar size="sm" className="shrink-0">
                    <AvatarFallback className="bg-muted text-muted-foreground text-xs font-medium">
                        {getInitials(activity.author.name)}
                    </AvatarFallback>
                </Avatar>
            )}

            <div
                className={cn(
                    'flex max-w-[75%] flex-col gap-1',
                    isOwn ? 'items-end' : 'items-start',
                )}
            >
                {!isOwn && (
                    <span className="text-muted-foreground px-1 text-xs font-medium">
                        {activity.author.name}
                    </span>
                )}

                <div
                    className={cn(
                        'rounded-2xl px-3 py-2',
                        isOwn
                            ? 'bg-primary text-primary-foreground rounded-br-sm'
                            : 'bg-muted rounded-bl-sm',
                    )}
                >
                    {activity.type === 'change_request' && (
                        <Badge
                            variant={isResolved ? 'secondary' : 'outline'}
                            className={cn(
                                'mb-1',
                                isOwn &&
                                    !isResolved &&
                                    'border-primary-foreground/40 text-primary-foreground',
                            )}
                        >
                            {isResolved ? 'Resolved' : 'Change requested'}
                        </Badge>
                    )}

                    {isReview && activity.review_status && (
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                            <Badge
                                variant={
                                    activity.review_status === 'approved'
                                        ? 'secondary'
                                        : activity.review_status ===
                                            'changes_requested'
                                          ? 'destructive'
                                          : 'outline'
                                }
                                className={cn(
                                    isOwn &&
                                        activity.review_status === 'pending' &&
                                        'border-primary-foreground/40 text-primary-foreground',
                                )}
                            >
                                {REVIEW_STATUS_LABEL[activity.review_status]}
                            </Badge>
                            {activity.reviewer && (
                                <span
                                    className={cn(
                                        'text-xs',
                                        isOwn
                                            ? 'text-primary-foreground/80'
                                            : 'text-muted-foreground',
                                    )}
                                >
                                    Reviewer: {activity.reviewer.name}
                                </span>
                            )}
                        </div>
                    )}

                    {activity.body && (
                        <p className="text-sm whitespace-pre-wrap">
                            {activity.body}
                        </p>
                    )}

                    {activity.attachment && (
                        <a
                            href={activity.attachment.download_url}
                            className={cn(
                                'mt-2 flex items-center gap-1.5 text-xs hover:underline',
                                isOwn
                                    ? 'text-primary-foreground/80'
                                    : 'text-muted-foreground',
                            )}
                        >
                            <Paperclip className="size-3.5" />
                            {activity.attachment.name}
                        </a>
                    )}
                </div>

                <div className="flex items-center gap-2 px-1">
                    <span className="text-muted-foreground text-[11px]">
                        {formatDate(activity.created_at)}
                    </span>
                    {depth === 0 && (
                        <button
                            type="button"
                            onClick={() => setReplying((v) => !v)}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                        >
                            <Reply className="size-3" />
                            Reply
                        </button>
                    )}
                    {activity.type === 'change_request' && canManage && (
                        <button
                            type="button"
                            onClick={toggleResolved}
                            className="text-muted-foreground hover:text-foreground text-[11px]"
                        >
                            {isResolved ? 'Reopen' : 'Mark resolved'}
                        </button>
                    )}
                    {canDecideReview && (
                        <button
                            type="button"
                            onClick={() => setDeciding((v) => !v)}
                            className="text-muted-foreground hover:text-foreground text-[11px]"
                        >
                            Review this
                        </button>
                    )}
                    {canResubmitReview && (
                        <button
                            type="button"
                            onClick={resubmitReview}
                            className="text-muted-foreground hover:text-foreground flex items-center gap-1 text-[11px]"
                        >
                            <RotateCcw className="size-3" />
                            Resubmit for review
                        </button>
                    )}
                </div>

                {deciding && (
                    <div className="w-full min-w-64 space-y-2">
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
                        className="w-full min-w-64 space-y-2"
                    >
                        <Textarea
                            rows={2}
                            placeholder="Write a reply..."
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
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
                    <div className="mt-1 w-full space-y-2">
                        {activity.replies.map((reply) => (
                            <ActivityCard
                                key={reply.id}
                                activity={reply}
                                projectId={projectId}
                                phaseId={phaseId}
                                canManage={canManage}
                                currentUserId={currentUserId}
                                depth={depth + 1}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function Composer({
    projectId,
    phaseId,
    projectMembers,
}: {
    projectId: number;
    phaseId: number;
    projectMembers: TaggableMember[];
}) {
    const { data, setData, post, processing, errors, reset } = useForm({
        type: 'comment' as 'comment' | 'change_request' | 'review',
        body: '',
        reviewer_id: '' as number | '',
        attachment: null as File | null,
    });

    function handleAttachmentChange(event: ChangeEvent<HTMLInputElement>) {
        setData('attachment', event.target.files?.[0] ?? null);
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
            <Tabs
                value={data.type}
                onValueChange={(value) =>
                    setData('type', value as typeof data.type)
                }
            >
                <TabsList className="w-full">
                    <TabsTrigger value="comment">
                        <MessageCircle className="size-3.5" />
                        Comment
                    </TabsTrigger>
                    <TabsTrigger value="change_request">
                        <AlertCircle className="size-3.5" />
                        Request changes
                    </TabsTrigger>
                    <TabsTrigger value="review">
                        <UserCheck className="size-3.5" />
                        Request review
                    </TabsTrigger>
                </TabsList>
            </Tabs>
            <p className="text-muted-foreground -mt-1 text-xs">
                {data.type === 'comment' &&
                    'General discussion, feedback, or a status update - purely informational, nothing to resolve.'}
                {data.type === 'change_request' &&
                    'Flags something that must change before this phase can move forward - stays "open" on the timeline until a manager marks it resolved.'}
                {data.type === 'review' &&
                    'Tag someone to formally approve or request changes on this - the cycle stays open until they approve.'}
            </p>

            {data.type === 'review' && (
                <Select
                    value={data.reviewer_id ? String(data.reviewer_id) : ''}
                    onValueChange={(value) =>
                        setData('reviewer_id', Number(value))
                    }
                >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a reviewer" />
                    </SelectTrigger>
                    <SelectContent>
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

            <Textarea
                rows={3}
                placeholder={
                    data.type === 'comment'
                        ? 'Share an update or ask a question...'
                        : data.type === 'change_request'
                          ? 'Describe the change you need...'
                          : 'Describe what needs to be reviewed...'
                }
                value={data.body}
                onChange={(e) => setData('body', e.target.value)}
            />

            <div className="flex items-center justify-between gap-2">
                <label className="text-muted-foreground flex cursor-pointer items-center gap-1.5 text-xs hover:underline">
                    <Paperclip className="size-3.5" />
                    {data.attachment ? data.attachment.name : 'Attach file'}
                    <input
                        type="file"
                        className="hidden"
                        onChange={handleAttachmentChange}
                    />
                </label>
                <Button
                    type="submit"
                    size="sm"
                    disabled={
                        processing ||
                        data.body.trim() === '' ||
                        (data.type === 'review' && !data.reviewer_id)
                    }
                >
                    Send
                </Button>
            </div>
            {errors.body && (
                <p className="text-destructive text-xs">{errors.body}</p>
            )}
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
}: {
    projectId: number;
    phase: TimelinePhase;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    projectMembers: TaggableMember[];
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

    return (
        <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-auto p-3">
                {activities.length === 0 ? (
                    <EmptyState
                        icon={MessageCircle}
                        message="No activity yet. Start the conversation below."
                    />
                ) : (
                    activities.map((activity) =>
                        activity.type === 'comment' ||
                        activity.type === 'change_request' ||
                        activity.type === 'review' ? (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                projectId={projectId}
                                phaseId={phase.id}
                                canManage={canManage}
                                currentUserId={currentUserId}
                            />
                        ) : (
                            <SystemLine key={activity.id} activity={activity} />
                        ),
                    )
                )}
            </div>

            <div className="border-t p-3">
                <Composer
                    projectId={projectId}
                    phaseId={phase.id}
                    projectMembers={projectMembers}
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
