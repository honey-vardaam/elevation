import { useState } from 'react';
import { router } from '@inertiajs/react';
import { CheckCircle2, Share2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/moodboards';
import type { MoodboardDetail } from '@/types';

export function ShareMoodboardDialog({
    open,
    onOpenChange,
    moodboard,
    manageableProjects = [],
    canManage = true,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    moodboard: MoodboardDetail;
    manageableProjects?: { id: number; name: string }[];
    canManage?: boolean;
}) {
    const [selectedProjectId, setSelectedProjectId] = useState<string>('');
    const [sharingToProject, setSharingToProject] = useState(false);

    function handleShareToProject() {
        if (!selectedProjectId) return;
        setSharingToProject(true);
        router.patch(
            update(moodboard.id).url,
            { project_id: Number(selectedProjectId) },
            {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success(
                        'Moodboard shared to project. All project members can now edit.',
                    );
                    setSharingToProject(false);
                    setSelectedProjectId('');
                },
                onError: () => {
                    toast.error('Failed to share moodboard to project.');
                    setSharingToProject(false);
                },
            },
        );
    }

    const membersCount =
        (moodboard.project?.owner ? 1 : 0) +
        (moodboard.project?.members?.length ?? 0);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="gap-1">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <Share2 className="size-4" />
                        Share moodboard
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Collaborate and share access to this moodboard.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-1">
                    {/* Access overview banner */}
                    <div className="rounded-lg border bg-muted/40 p-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                    <Users className="size-3.5 text-muted-foreground" />
                                    <span className="text-xs font-semibold text-foreground">
                                        {moodboard.project
                                            ? moodboard.project.name
                                            : 'Personal board'}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {moodboard.project
                                        ? 'Anyone with access to this project can view and edit this moodboard.'
                                        : 'Only you currently have access to this board.'}
                                </p>
                            </div>
                            <Badge
                                variant="secondary"
                                className="shrink-0 gap-1 border-emerald-500/20 bg-emerald-500/10 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
                            >
                                <CheckCircle2 className="size-3" />
                                <span>Can edit</span>
                            </Badge>
                        </div>
                    </div>

                    {/* Members list if linked to a project */}
                    {moodboard.project && membersCount > 0 && (
                        <div className="space-y-2">
                            <span className="text-xs font-medium text-muted-foreground">
                                Team members with edit access ({membersCount})
                            </span>
                            <div className="max-h-48 space-y-2 overflow-y-auto pr-1">
                                {moodboard.project.owner && (
                                    <div className="flex items-center justify-between gap-2">
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar className="size-7">
                                                <AvatarFallback className="text-[11px]">
                                                    {moodboard.project.owner.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-foreground">
                                                    {moodboard.project.owner.name}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {moodboard.project.owner.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <Badge
                                                variant="outline"
                                                className="px-1.5 py-0 text-[10px] capitalize"
                                            >
                                                Owner
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
                                            >
                                                Can edit
                                            </Badge>
                                        </div>
                                    </div>
                                )}
                                {moodboard.project.members?.map((member) => (
                                    <div
                                        key={member.id}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar className="size-7">
                                                <AvatarFallback className="text-[11px]">
                                                    {member.user.name
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-xs font-medium text-foreground">
                                                    {member.user.name}
                                                </p>
                                                <p className="truncate text-[11px] text-muted-foreground">
                                                    {member.user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-1.5">
                                            <Badge
                                                variant="outline"
                                                className="px-1.5 py-0 text-[10px] capitalize"
                                            >
                                                {member.role}
                                            </Badge>
                                            <Badge
                                                variant="secondary"
                                                className="px-1.5 py-0 text-[10px] text-emerald-600 dark:text-emerald-400"
                                            >
                                                Can edit
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Personal board: allow sharing to a project */}
                    {!moodboard.project && canManage && manageableProjects.length > 0 && (
                        <div className="space-y-2 rounded-lg border border-dashed p-3">
                            <label
                                htmlFor="share-to-project"
                                className="block text-xs font-medium text-foreground"
                            >
                                Share with a project
                            </label>
                            <p className="text-[11px] text-muted-foreground">
                                Assign this moodboard to a project so all project members can view and edit it.
                            </p>
                            <div className="flex items-center gap-2 pt-1">
                                <select
                                    id="share-to-project"
                                    value={selectedProjectId}
                                    onChange={(e) =>
                                        setSelectedProjectId(e.target.value)
                                    }
                                    className="bg-input/50 focus-visible:border-ring focus-visible:ring-ring/30 text-foreground flex h-8 flex-1 rounded-2xl border border-transparent px-2.5 py-1 text-xs transition-[color,box-shadow] duration-200 outline-none focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 [&>option]:bg-popover [&>option]:text-popover-foreground"
                                >
                                    <option value="" disabled>
                                        Select project...
                                    </option>
                                    {manageableProjects.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.name}
                                        </option>
                                    ))}
                                </select>
                                <Button
                                    type="button"
                                    size="sm"
                                    disabled={
                                        !selectedProjectId || sharingToProject
                                    }
                                    onClick={handleShareToProject}
                                    className="h-8 shrink-0 gap-1.5 text-xs"
                                >
                                    {sharingToProject && (
                                        <Spinner className="size-3" />
                                    )}
                                    <span>Share</span>
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

