import { type CSSProperties, useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
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
    ProjectStorageFile,
    TaggableMember,
} from '@/types';

type CurrentPhase = Pick<
    ProjectPhaseSummary,
    'id' | 'name' | 'status' | 'open_change_requests_count'
>;

/**
 * The project's one dedicated collaboration space - toggleable offcanvas,
 * bound to whichever phase is currently active.
 */
export function ProjectChatPanel({
    projectId,
    phase,
    phases = [],
    onSelectPhase,
    activities,
    canManage,
    nextPhaseName,
    projectMembers,
    projectFiles,
    open,
    onOpenChange,
}: {
    projectId: number;
    phase: CurrentPhase | null;
    phases?: ProjectPhaseSummary[];
    onSelectPhase?: (phaseId: number) => void;
    activities: PhaseActivitySummary[];
    canManage: boolean;
    nextPhaseName: string | null;
    projectMembers: TaggableMember[];
    projectFiles: ProjectStorageFile[];
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    // Keep rendering the last active phase's content while the panel is
    // sliding shut so it doesn't vanish before the close transition
    // finishes — the sidebar's own animation is 350ms.
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
            open={open}
            onOpenChange={onOpenChange}
            className="min-h-0 w-auto"
            style={{ '--sidebar-width': '24rem' } as CSSProperties}
        >
            <Sidebar
                side="right"
                collapsible="offcanvas"
                className="inset-y-auto top-16 h-[calc(100svh-4rem)]"
            >
                {displayPhase && (
                    <>
                        <SidebarHeader className="flex-row items-center justify-between border-b px-4 py-3">
                            <div className="flex min-w-0 flex-1 items-center gap-2 mr-2">
                                {phases.length > 1 ? (
                                    <Select
                                        value={displayPhase ? String(displayPhase.id) : undefined}
                                        onValueChange={(val) => onSelectPhase?.(Number(val))}
                                    >
                                        <SelectTrigger className="h-8 max-w-[180px] text-xs font-medium truncate">
                                            <SelectValue placeholder="Select phase" />
                                        </SelectTrigger>
                                        <SelectContent align="start">
                                            {phases.map((p) => (
                                                <SelectItem key={p.id} value={String(p.id)}>
                                                    <div className="flex items-center gap-2">
                                                        <span className="truncate">{p.name}</span>
                                                        <span className="text-muted-foreground text-[10px]">
                                                            ({statusLabel(p.status)})
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {displayPhase.name}
                                        </p>
                                    </div>
                                )}

                                <Badge
                                    variant={
                                        displayPhase.status === 'completed'
                                            ? 'default'
                                            : displayPhase.status === 'in_progress'
                                              ? 'secondary'
                                              : 'outline'
                                    }
                                    className="shrink-0 text-xs"
                                >
                                    {statusLabel(displayPhase.status)}
                                </Badge>
                            </div>

                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => onOpenChange(false)}
                                className="shrink-0"
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
                                projectFiles={projectFiles}
                            />
                        </SidebarContent>
                    </>
                )}
            </Sidebar>
        </SidebarProvider>
    );
}
