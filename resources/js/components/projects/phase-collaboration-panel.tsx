import { type CSSProperties } from 'react';
import { MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarProvider,
} from '@/components/ui/sidebar';
import {
    PhaseTimeline,
    statusLabel,
} from '@/components/projects/phase-timeline';
import type {
    PhaseActivitySummary,
    ProjectPhaseSummary,
    TaggableMember,
} from '@/types';

export function PhaseCollaborationPanel({
    projectId,
    phase,
    activities,
    canManage,
    nextPhaseName,
    projectMembers,
    onClose,
}: {
    projectId: number;
    phase: ProjectPhaseSummary | null;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    projectMembers: TaggableMember[];
    onClose: () => void;
}) {
    return (
        <SidebarProvider
            persist={false}
            open={phase !== null}
            onOpenChange={(open) => !open && onClose()}
            className="min-h-0 w-auto"
            style={{ '--sidebar-width': '24rem' } as CSSProperties}
        >
            <Sidebar side="right" collapsible="offcanvas">
                {phase && (
                    <>
                        <SidebarHeader className="flex-row items-center justify-between border-b">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                                    <MessageSquare className="size-4" />
                                    {phase.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {statusLabel(phase.status)}
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={onClose}
                            >
                                <X className="size-4" />
                                <span className="sr-only">Close</span>
                            </Button>
                        </SidebarHeader>

                        <SidebarContent className="p-0">
                            <PhaseTimeline
                                projectId={projectId}
                                phase={phase}
                                activities={activities}
                                canManage={canManage}
                                nextPhaseName={nextPhaseName}
                                projectMembers={projectMembers}
                            />
                        </SidebarContent>
                    </>
                )}
            </Sidebar>
        </SidebarProvider>
    );
}
