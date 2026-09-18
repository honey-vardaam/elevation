import { router } from '@inertiajs/react';
import { useMemo, useState } from 'react';
import { Search, Share2, UserPlus, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import reviewers from '@/routes/comparisons/reviewers';
import type { ComparisonReviewer } from '@/types';

function initials(name: string): string {
    return name.slice(0, 2).toUpperCase();
}

/**
 * Invites an Elevation user - project member or not - as a reviewer, which
 * grants them view + comment access to this one comparison. Deliberately
 * stops there for now: no email/notification is sent yet (see the module's
 * collaboration-integration roadmap), so whoever shares it should still
 * point the reviewer to the link themselves.
 */
export function ShareComparisonDialog({
    open,
    onOpenChange,
    comparisonId,
    reviewers: currentReviewers,
    elevationUsers,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    comparisonId: number;
    reviewers: ComparisonReviewer[];
    elevationUsers: ComparisonReviewer[];
}) {
    const [query, setQuery] = useState('');
    const reviewerIds = useMemo(
        () => new Set(currentReviewers.map((r) => r.id)),
        [currentReviewers],
    );

    const candidates = useMemo(() => {
        const q = query.trim().toLowerCase();
        return elevationUsers
            .filter((user) => !reviewerIds.has(user.id))
            .filter(
                (user) =>
                    !q ||
                    user.name.toLowerCase().includes(q) ||
                    user.email.toLowerCase().includes(q),
            )
            .slice(0, 8);
    }, [elevationUsers, reviewerIds, query]);

    function invite(userId: number) {
        router.post(
            reviewers.store(comparisonId).url,
            { user_id: userId },
            { preserveScroll: true },
        );
    }

    function remove(userId: number) {
        router.delete(reviewers.destroy([comparisonId, userId]).url, {
            preserveScroll: true,
        });
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="gap-1">
                    <DialogTitle className="flex items-center gap-2 text-base font-semibold">
                        <Share2 className="size-4" />
                        Share for review
                    </DialogTitle>
                    <DialogDescription className="text-xs">
                        Invite any Elevation user to view and comment on this
                        comparison, even if they're not on the project.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 pt-1">
                    <div className="relative">
                        <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Search people by name or email…"
                            className="pl-8"
                        />
                    </div>

                    {query.trim() !== '' && (
                        <div className="max-h-40 space-y-0.5 overflow-y-auto rounded-lg border p-1">
                            {candidates.length === 0 ? (
                                <p className="text-muted-foreground p-2 text-xs">
                                    No matching people.
                                </p>
                            ) : (
                                candidates.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => {
                                            invite(user.id);
                                            setQuery('');
                                        }}
                                        className="hover:bg-muted/60 flex w-full items-center gap-2.5 rounded-md p-1.5 text-left"
                                    >
                                        <Avatar size="sm">
                                            <AvatarFallback className="text-[10px]">
                                                {initials(user.name)}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm">
                                                {user.name}
                                            </p>
                                            <p className="text-muted-foreground truncate text-xs">
                                                {user.email}
                                            </p>
                                        </div>
                                        <UserPlus className="text-muted-foreground size-4 shrink-0" />
                                    </button>
                                ))
                            )}
                        </div>
                    )}

                    <div className="space-y-2">
                        <span className="text-muted-foreground text-xs font-medium">
                            Reviewers ({currentReviewers.length})
                        </span>
                        {currentReviewers.length === 0 ? (
                            <p className="text-muted-foreground text-xs">
                                No one has been invited yet.
                            </p>
                        ) : (
                            <div className="max-h-48 space-y-1 overflow-y-auto">
                                {currentReviewers.map((reviewer) => (
                                    <div
                                        key={reviewer.id}
                                        className="flex items-center justify-between gap-2"
                                    >
                                        <div className="flex min-w-0 items-center gap-2.5">
                                            <Avatar size="sm">
                                                <AvatarFallback className="text-[10px]">
                                                    {initials(reviewer.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm">
                                                    {reviewer.name}
                                                </p>
                                                <p className="text-muted-foreground truncate text-xs">
                                                    {reviewer.email}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon-xs"
                                            onClick={() => remove(reviewer.id)}
                                        >
                                            <X className="size-3.5" />
                                            <span className="sr-only">
                                                Remove {reviewer.name}
                                            </span>
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
