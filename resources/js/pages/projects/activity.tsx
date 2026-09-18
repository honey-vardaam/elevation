import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import type { ReactNode } from 'react';
import {
    AlertTriangle,
    ArrowLeft,
    CheckCircle2,
    FileUp,
    FilePen,
    FileX,
    MessageSquare,
    RefreshCw,
    UserMinus,
    UserPlus,
    Users,
} from 'lucide-react';
import { PastPhaseDialog } from '@/components/projects/past-phase-dialog';
import { EmptyState } from '@/components/empty-state';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import AppLayout from '@/layouts/app-layout';
import { activity, index, show } from '@/routes/projects';
import type { ActivityFeedItem, Paginated } from '@/types';

function ActivityIcon({ type }: { type: string }) {
    const className = 'text-muted-foreground size-4 shrink-0';

    switch (type) {
        case 'member_added':
            return <UserPlus className={className} />;
        case 'member_removed':
            return <UserMinus className={className} />;
        case 'member_role_changed':
            return <Users className={className} />;
        case 'file_uploaded':
            return <FileUp className={className} />;
        case 'file_updated':
            return <FilePen className={className} />;
        case 'file_deleted':
            return <FileX className={className} />;
        case 'change_request':
            return <AlertTriangle className={className} />;
        case 'status_changed':
        case 'project_status_changed':
            return <RefreshCw className={className} />;
        case 'approved':
        case 'project_completed':
            return <CheckCircle2 className={className} />;
        default:
            return <MessageSquare className={className} />;
    }
}

function formatDateTime(iso: string): string {
    return new Date(iso).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    });
}

export default function ProjectActivity({
    project,
    activities,
}: {
    project: { id: number; name: string };
    activities: Paginated<ActivityFeedItem>;
}) {
    const [viewingPhaseId, setViewingPhaseId] = useState<number | null>(null);

    function handleActivityClick(activity: ActivityFeedItem) {
        if (!activity.action) {
            return;
        }

        if (activity.action.type === 'open_phase_dialog') {
            setViewingPhaseId(activity.action.phase_id);
        } else if (activity.action.type === 'scroll_to_chat') {
            router.get(show(project.id).url);
        } else if (activity.action.type === 'open_folder') {
            const params = new URLSearchParams({ view: 'list' });
            if (activity.action.folder_id) {
                params.set('folder', String(activity.action.folder_id));
            }
            router.get(`${show(project.id).url}?${params.toString()}`);
        }
    }

    function ActivityRow({ activity }: { activity: ActivityFeedItem }) {
        const content: ReactNode = (
            <div className="flex items-start gap-3 rounded-lg border p-3">
                <ActivityIcon type={activity.type} />
                <div className="min-w-0 flex-1">
                    <p className="text-sm">
                        {activity.actor && (
                            <span className="font-medium">
                                {activity.actor.name}{' '}
                            </span>
                        )}
                        <span className="text-muted-foreground">
                            {activity.summary}
                        </span>
                    </p>
                    <p className="text-muted-foreground mt-0.5 text-xs">
                        {formatDateTime(activity.created_at)}
                    </p>
                </div>
            </div>
        );

        if (!activity.action) {
            return content;
        }

        return (
            <button
                type="button"
                onClick={() => handleActivityClick(activity)}
                className="hover:bg-muted/40 w-full text-left transition-colors"
            >
                {content}
            </button>
        );
    }

    return (
        <>
            <Head title={`${project.name} - Activity`} />

            <div className="mx-auto max-w-3xl space-y-4 p-4">
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon-sm" asChild>
                        <Link href={show(project.id).url}>
                            <ArrowLeft className="size-4" />
                            <span className="sr-only">Back to project</span>
                        </Link>
                    </Button>
                    <div>
                        <h1 className="font-heading text-xl font-semibold tracking-tight">
                            Activity
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            {project.name}
                        </p>
                    </div>
                </div>

                {activities.data.length === 0 ? (
                    <EmptyState
                        icon={MessageSquare}
                        message="Nothing has happened on this project yet."
                    />
                ) : (
                    <div className="space-y-2">
                        {activities.data.map((activity) => (
                            <ActivityRow
                                key={activity.id}
                                activity={activity}
                            />
                        ))}
                    </div>
                )}

                {activities.data.length > 0 && (
                    <Pagination
                        links={activities.links}
                        from={activities.from}
                        to={activities.to}
                        total={activities.total}
                        perPage={activities.per_page}
                    />
                )}
            </div>

            <PastPhaseDialog
                projectId={project.id}
                phaseId={viewingPhaseId}
                onOpenChange={(open) => !open && setViewingPhaseId(null)}
            />
        </>
    );
}

ProjectActivity.layout = (page: unknown) => {
    const props = page as
        | {
              project?: { id: number; name: string };
              props?: { project?: { id: number; name: string } };
          }
        | undefined;
    const project = props?.props?.project ?? props?.project;

    return (
        <AppLayout
            breadcrumbs={
                project
                    ? [
                          { title: 'Projects', href: index() },
                          { title: project.name, href: show(project.id) },
                          {
                              title: 'Activity',
                              href: activity(project.id),
                          },
                      ]
                    : [{ title: 'Projects', href: index() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
