import { Head, Link, router } from '@inertiajs/react';
import { Inbox as InboxIcon } from 'lucide-react';
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

export default function Inbox({
    conversations,
    activePhaseId,
    activePhase,
    activities,
    canManage,
    nextPhaseName,
    taggableMembers,
}: {
    conversations: ConversationSummary[];
    activePhaseId: number | null;
    activePhase: ActivePhase | null;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    taggableMembers: TaggableMember[];
}) {
    function selectConversation(phaseId: number) {
        router.get(index().url, { phase: phaseId }, { preserveScroll: true });
    }

    return (
        <>
            <Head title="Inbox" />

            <div className="flex min-w-0 flex-1">
                <div className="w-80 shrink-0 overflow-y-auto border-r">
                    {conversations.length === 0 ? (
                        <div className="text-muted-foreground flex flex-col items-center gap-2 p-8 text-center text-sm">
                            <InboxIcon className="size-6" />
                            No conversations yet. Comments and change requests
                            posted on a project's phases will show up here.
                        </div>
                    ) : (
                        conversations.map((conversation) => (
                            <button
                                key={conversation.phase_id}
                                type="button"
                                onClick={() =>
                                    selectConversation(conversation.phase_id)
                                }
                                className={`hover:bg-muted/50 w-full border-b p-3 text-left transition-colors ${
                                    conversation.phase_id === activePhaseId
                                        ? 'bg-muted'
                                        : ''
                                }`}
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <p className="text-muted-foreground truncate text-xs">
                                        {conversation.project.name}
                                    </p>
                                    {conversation.open_change_requests_count >
                                        0 && (
                                        <Badge variant="destructive">
                                            {
                                                conversation.open_change_requests_count
                                            }
                                        </Badge>
                                    )}
                                </div>
                                <p className="truncate text-sm font-medium">
                                    {conversation.phase_name}
                                </p>
                                {conversation.last_activity && (
                                    <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                        {conversation.last_activity.author_name}
                                        : {conversation.last_activity.preview}
                                    </p>
                                )}
                                {conversation.last_activity && (
                                    <p className="text-muted-foreground mt-0.5 text-xs">
                                        {formatDate(
                                            conversation.last_activity
                                                .created_at,
                                        )}
                                    </p>
                                )}
                            </button>
                        ))
                    )}
                </div>

                <div className="flex flex-1 flex-col">
                    {activePhase ? (
                        <>
                            <div className="border-b p-3">
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
