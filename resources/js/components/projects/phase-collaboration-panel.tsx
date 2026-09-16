import { type CSSProperties, useEffect, useState } from 'react';
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
    // Keep rendering the last active phase's content while the panel is
    // sliding shut so it doesn't vanish before the close transition
    // finishes — the sidebar's own animation is 350ms (matches Bootstrap's
    // accordion collapse).
    const [displayPhase, setDisplayPhase] = useState(phase);

    useEffect(() => {
        if (phase) {
            setDisplayPhase(phase);
            return;
        }

        const timeout = setTimeout(() => setDisplayPhase(null), 370);
        return () => clearTimeout(timeout);
    }, [phase]);

    return (
        <SidebarProvider
            persist={false}
            open={phase !== null}
            onOpenChange={(open) => !open && onClose()}
            className="min-h-0 w-auto"
            style={{ '--sidebar-width': '28rem' } as CSSProperties}
        >
            <Sidebar side="right" collapsible="offcanvas">
                {displayPhase && (
                    <>
                        <SidebarHeader className="flex-row items-center justify-between border-b">
                            <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                                    <MessageSquare className="size-4" />
                                    {displayPhase.name}
                                </p>
                                <p className="text-muted-foreground text-xs">
                                    {statusLabel(displayPhase.status)}
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
                                phase={displayPhase}
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
