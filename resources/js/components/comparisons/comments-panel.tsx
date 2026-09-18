import { router } from '@inertiajs/react';
import { type FormEvent, useState } from 'react';
import {
    Check,
    MessageSquare,
    MoreHorizontal,
    RotateCcw,
    Trash2,
} from 'lucide-react';
import { EmptyState } from '@/components/empty-state';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import annotations from '@/routes/comparisons/annotations';
import { cn } from '@/lib/utils';
import type { ComparisonAnnotation, ComparisonAnnotationSide } from '@/types';

const SIDE_LABEL: Record<ComparisonAnnotationSide, string> = {
    left: 'Left',
    right: 'Right',
    general: 'General',
};

function initials(name: string): string {
    return name.slice(0, 2).toUpperCase();
}

function timeAgo(iso: string): string {
    const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.round(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
}

function AnnotationRow({
    comparisonId,
    annotation,
    depth,
    active,
    onFocus,
    currentUserId,
    canManage,
}: {
    comparisonId: number;
    annotation: ComparisonAnnotation;
    depth: number;
    active: boolean;
    onFocus: (annotation: ComparisonAnnotation) => void;
    currentUserId: number;
    canManage: boolean;
}) {
    const [replying, setReplying] = useState(false);
    const [body, setBody] = useState('');
    const canDelete = annotation.author.id === currentUserId;
    const canResolve =
        depth === 0 && (annotation.author.id === currentUserId || canManage);

    function submitReply(event: FormEvent) {
        event.preventDefault();
        if (!body.trim()) return;

        router.post(
            annotations.store(comparisonId).url,
            { side: 'general', body, parent_id: annotation.id },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setBody('');
                    setReplying(false);
                },
            },
        );
    }

    function destroy() {
        router.delete(annotations.destroy([comparisonId, annotation.id]).url, {
            preserveScroll: true,
        });
    }

    function toggleResolve() {
        router.patch(
            annotations.resolve([comparisonId, annotation.id]).url,
            {},
            { preserveScroll: true },
        );
    }

    return (
        <div
            className={cn(
                'space-y-2 rounded-lg border p-3 transition-colors',
                depth > 0 && 'ml-6 border-dashed',
                active && 'border-primary bg-primary/5',
                annotation.resolved_at && 'opacity-60',
            )}
            onClick={() => onFocus(annotation)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2">
                    <Avatar size="sm">
                        <AvatarFallback className="text-[10px]">
                            {initials(annotation.author.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                            {annotation.author.name}
                        </p>
                        <p className="text-muted-foreground text-xs">
                            {timeAgo(annotation.created_at)}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                    {depth === 0 && annotation.side !== 'general' && (
                        <Badge variant="outline" className="text-[10px]">
                            {SIDE_LABEL[annotation.side]}
                        </Badge>
                    )}
                    {annotation.resolved_at && (
                        <Badge
                            variant="secondary"
                            className="gap-1 text-[10px]"
                        >
                            <Check className="size-2.5" />
                            Resolved
                        </Badge>
                    )}
                    {(canDelete || canResolve) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="size-3.5" />
                                    <span className="sr-only">Actions</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canResolve && (
                                    <DropdownMenuItem onSelect={toggleResolve}>
                                        {annotation.resolved_at ? (
                                            <>
                                                <RotateCcw className="size-4" />
                                                Reopen
                                            </>
                                        ) : (
                                            <>
                                                <Check className="size-4" />
                                                Resolve
                                            </>
                                        )}
                                    </DropdownMenuItem>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={destroy}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>

            <p className="text-sm whitespace-pre-wrap">{annotation.body}</p>

            {depth === 0 && (
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setReplying((v) => !v);
                    }}
                    className="text-muted-foreground hover:text-foreground text-xs font-medium"
                >
                    Reply
                </button>
            )}

            {replying && (
                <form
                    onSubmit={submitReply}
                    className="flex items-start gap-2 pt-1"
                >
                    <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Write a reply…"
                        rows={2}
                        className="text-sm"
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                    />
                    <Button type="submit" size="sm" disabled={!body.trim()}>
                        Reply
                    </Button>
                </form>
            )}

            {annotation.replies.length > 0 && (
                <div className="space-y-2 pt-1">
                    {annotation.replies.map((reply) => (
                        <AnnotationRow
                            key={reply.id}
                            comparisonId={comparisonId}
                            annotation={reply}
                            depth={depth + 1}
                            active={false}
                            onFocus={onFocus}
                            currentUserId={currentUserId}
                            canManage={canManage}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function CommentsPanel({
    comparisonId,
    threads,
    activeId,
    onFocus,
    currentUserId,
    canManage,
    readOnly,
}: {
    comparisonId: number;
    threads: ComparisonAnnotation[];
    activeId: number | null;
    onFocus: (annotation: ComparisonAnnotation) => void;
    currentUserId: number;
    canManage: boolean;
    readOnly: boolean;
}) {
    const [body, setBody] = useState('');
    const [posting, setPosting] = useState(false);

    function submitGeneral(event: FormEvent) {
        event.preventDefault();
        if (!body.trim()) return;

        setPosting(true);
        router.post(
            annotations.store(comparisonId).url,
            { side: 'general', body },
            {
                preserveScroll: true,
                onSuccess: () => setBody(''),
                onFinish: () => setPosting(false),
            },
        );
    }

    return (
        <div className="flex h-full flex-col">
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto p-3">
                {threads.length === 0 ? (
                    <EmptyState
                        icon={MessageSquare}
                        message="No comments yet. Click on either file to pin one, or start a general discussion below."
                    />
                ) : (
                    threads.map((annotation) => (
                        <AnnotationRow
                            key={annotation.id}
                            comparisonId={comparisonId}
                            annotation={annotation}
                            depth={0}
                            active={annotation.id === activeId}
                            onFocus={onFocus}
                            currentUserId={currentUserId}
                            canManage={canManage}
                        />
                    ))
                )}
            </div>

            {!readOnly && (
                <form
                    onSubmit={submitGeneral}
                    className="flex items-start gap-2 border-t p-3"
                >
                    <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        placeholder="Add a general comment…"
                        rows={2}
                        className="text-sm"
                    />
                    <Button
                        type="submit"
                        size="sm"
                        disabled={posting || !body.trim()}
                    >
                        Post
                    </Button>
                </form>
            )}
        </div>
    );
}
