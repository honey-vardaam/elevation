import { Head, Link, router } from '@inertiajs/react';
import {
    AlertCircle,
    Eye,
    Inbox as InboxIcon,
    type LucideIcon,
    UserCheck,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import {
    PhaseTimeline,
    statusLabel,
} from '@/components/projects/phase-timeline';
import { Badge } from '@/components/ui/badge';
import { show as showProject } from '@/routes/projects';
import { index } from '@/routes/inbox';
import type {
    ActivePhase,
    ConversationSummary,
    PhaseActivitySummary,
    ProjectStorageFile,
    TaggableMember,
} from '@/types';

function formatDate(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

function conversationAction(conversation: ConversationSummary): {
    label: string;
    Icon: LucideIcon;
    className: string;
} {
    if (conversation.pending_review_for_me) {
        return {
            label: 'Review',
            Icon: UserCheck,
            className: 'bg-primary/10 text-primary',
        };
    }

    if (conversation.open_change_requests_count > 0) {
        return {
            label: 'Review changes',
            Icon: AlertCircle,
            className: 'bg-destructive/10 text-destructive',
        };
    }

    return {
        label: 'View',
        Icon: Eye,
        className: 'bg-muted text-muted-foreground',
    };
}

export default function Inbox({
    conversations,
    activePhaseId,
    activePhase,
    activities,
    canManage,
    nextPhaseName,
    taggableMembers,
    projectFiles,
}: {
    conversations: ConversationSummary[];
    activePhaseId: number | null;
    activePhase: ActivePhase | null;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    taggableMembers: TaggableMember[];
    projectFiles: ProjectStorageFile[];
}) {
    function selectConversation(phaseId: number) {
        router.get(index().url, { phase: phaseId }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Inbox" />

            <h1 className="sr-only">Inbox</h1>

            <div className="flex h-[calc(100svh-4rem)] min-w-0">
                <div className="w-80 shrink-0 overflow-y-auto border-r">
                    {conversations.length === 0 ? (
                        <EmptyState
                            icon={InboxIcon}
                            message="No conversations yet. Comments and change requests posted on a project's phases will show up here."
                        />
                    ) : (
                        conversations.map((conversation) => {
                            const action = conversationAction(conversation);

                            return (
                                <button
                                    key={conversation.phase_id}
                                    type="button"
                                    onClick={() =>
                                        selectConversation(
                                            conversation.phase_id,
                                        )
                                    }
                                    className={`hover:bg-muted/50 w-full border-b p-3 text-left transition-colors ${
                                        conversation.phase_id === activePhaseId
                                            ? 'bg-muted'
                                            : ''
                                    }`}
                                >
                                    <p className="text-muted-foreground truncate text-[11px] font-medium tracking-wide uppercase">
                                        {conversation.project.name}
                                    </p>
                                    <div className="mt-1.5 flex items-center gap-2">
                                        <p className="min-w-0 flex-1 truncate text-base leading-tight font-semibold">
                                            {conversation.phase_name}
                                        </p>
                                        {conversation.open_change_requests_count >
                                            0 && (
                                            <Badge
                                                variant="secondary"
                                                className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 py-0 text-xs font-medium leading-none tabular-nums"
                                            >
                                                {
                                                    conversation.open_change_requests_count
                                                }
                                            </Badge>
                                        )}
                                    </div>
                                    {conversation.last_activity && (
                                        <p className="text-muted-foreground mt-1.5 truncate text-xs">
                                            <span className="text-foreground/80 font-medium">
                                                {
                                                    conversation.last_activity
                                                        .author_name
                                                }
                                            </span>
                                            {': '}
                                            {conversation.last_activity.preview}
                                        </p>
                                    )}
                                    <div className="mt-2.5 flex items-center justify-between gap-2">
                                        {conversation.last_activity ? (
                                            <span className="text-muted-foreground shrink-0 text-[11px]">
                                                {formatDate(
                                                    conversation.last_activity
                                                        .created_at,
                                                )}
                                            </span>
                                        ) : (
                                            <span />
                                        )}
                                        <span
                                            className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${action.className}`}
                                        >
                                            <action.Icon className="size-3" />
                                            {action.label}
                                        </span>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>

                <div className="flex min-h-0 flex-1 flex-col">
                    {activePhase ? (
                        <>
                            <div className="bg-background sticky top-0 z-10 shrink-0 border-b p-3">
                                <Link
                                    href={showProject(activePhase.project.id)}
                                    className="text-muted-foreground text-xs hover:underline"
                                >
                                    {activePhase.project.name}
                                </Link>
                                <p className="text-sm font-medium">
                                    {activePhase.name}
                                    <span className="text-muted-foreground ml-2 text-xs font-normal">
                                        {statusLabel(activePhase.status)}
                                    </span>
                                </p>
                            </div>
                            <div className="min-h-0 flex-1">
                                <PhaseTimeline
                                    projectId={activePhase.project.id}
                                    phase={activePhase}
                                    activities={activities}
                                    canManage={canManage}
                                    nextPhaseName={nextPhaseName}
                                    projectMembers={taggableMembers}
                                    projectFiles={projectFiles}
                                />
                            </div>
                        </>
                    ) : (
                        <div className="text-muted-foreground flex flex-1 items-center justify-center text-sm">
                            Select a conversation to view it.
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

Inbox.layout = {
    breadcrumbs: [{ title: 'Inbox', href: index() }],
};
