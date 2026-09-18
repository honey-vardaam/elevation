import { Head, Link, router, usePage } from '@inertiajs/react';
import { useMemo, useRef, useState } from 'react';
import {
    ArrowLeft,
    Columns2,
    MessageSquarePlus,
    MessagesSquare,
    MoreHorizontal,
    RotateCcw,
    Share2,
    SquareStack,
    Trash2,
    Zap,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { toast } from 'sonner';
import { ComparisonOverlay } from '@/components/comparisons/comparison-overlay';
import {
    ComparisonPane,
    FileMeta,
} from '@/components/comparisons/comparison-pane';
import { CommentsPanel } from '@/components/comparisons/comments-panel';
import { PickFileDialog } from '@/components/comparisons/pick-file-dialog';
import { ShareComparisonDialog } from '@/components/comparisons/share-comparison-dialog';
import { useZoomPan } from '@/components/comparisons/use-zoom-pan';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import AppLayout from '@/layouts/app-layout';
import { destroy, index, show, update } from '@/routes/comparisons';
import annotations from '@/routes/comparisons/annotations';
import type {
    ComparisonAnnotation,
    ComparisonDetail,
    ComparisonFileSummary,
    ComparisonMode,
    ComparisonReviewer,
} from '@/types';

type DraftPin = { side: 'left' | 'right'; x: number; y: number };

export default function ComparisonShow({
    comparison,
    leftFile,
    rightFile,
    otherFiles,
    annotations: threads,
    reviewers,
    can,
    elevationUsers,
}: {
    comparison: ComparisonDetail;
    leftFile: ComparisonFileSummary | null;
    rightFile: ComparisonFileSummary | null;
    otherFiles: ComparisonFileSummary[];
    annotations: ComparisonAnnotation[];
    reviewers: ComparisonReviewer[];
    can: { update: boolean; delete: boolean; manageReviewers: boolean };
    elevationUsers: ComparisonReviewer[];
}) {
    const currentUserId = usePage().props.auth.user.id;
    const readOnly = !can.update;

    const [mode, setMode] = useState<ComparisonMode>(comparison.mode);
    const [commentTool, setCommentTool] = useState(false);
    const [draftPin, setDraftPin] = useState<DraftPin | null>(null);
    const [draftBody, setDraftBody] = useState('');
    const [posting, setPosting] = useState(false);
    const [activeAnnotationId, setActiveAnnotationId] = useState<number | null>(
        null,
    );
    const [blinking, setBlinking] = useState(false);
    const [pickingFor, setPickingFor] = useState<'left' | 'right' | null>(null);
    const [shareOpen, setShareOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [naturalSizes, setNaturalSizes] = useState<{
        left: boolean;
        right: boolean;
    }>({ left: false, right: false });

    const centerRef = useRef<HTMLDivElement>(null);
    const zoomPan = useZoomPan(centerRef);

    const leftPins = useMemo(
        () =>
            threads
                .filter(
                    (a) => a.side === 'left' && a.x !== null && a.y !== null,
                )
                .map((a, i) => ({
                    id: a.id,
                    x: a.x as number,
                    y: a.y as number,
                    number: i + 1,
                    resolved: a.resolved_at !== null,
                })),
        [threads],
    );
    const rightPins = useMemo(
        () =>
            threads
                .filter(
                    (a) => a.side === 'right' && a.x !== null && a.y !== null,
                )
                .map((a, i) => ({
                    id: a.id,
                    x: a.x as number,
                    y: a.y as number,
                    number: i + 1,
                    resolved: a.resolved_at !== null,
                })),
        [threads],
    );

    function changeMode(next: ComparisonMode) {
        setMode(next);
        if (!readOnly) {
            router.patch(
                update(comparison.id).url,
                { mode: next },
                { preserveScroll: true, preserveState: true },
            );
        }
    }

    function toggleCommentTool() {
        setCommentTool((v) => !v);
        setDraftPin(null);
    }

    function handlePlacePin(side: 'left' | 'right', x: number, y: number) {
        setDraftPin({ side, x, y });
        setDraftBody('');
        setCommentTool(false);
    }

    function submitDraft() {
        if (!draftPin || !draftBody.trim()) return;

        setPosting(true);
        router.post(
            annotations.store(comparison.id).url,
            {
                side: draftPin.side,
                x: draftPin.x,
                y: draftPin.y,
                body: draftBody,
            },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setDraftPin(null);
                    setDraftBody('');
                },
                onError: () => toast.error("Couldn't post that comment."),
                onFinish: () => setPosting(false),
            },
        );
    }

    function pickFile(fileId: number) {
        if (!pickingFor) return;
        router.patch(
            update(comparison.id).url,
            { [`${pickingFor}_file_id`]: fileId },
            { preserveScroll: true },
        );
    }

    function rename(title: string) {
        const trimmed = title.trim();
        if (!trimmed || trimmed === comparison.title) return;
        router.patch(
            update(comparison.id).url,
            { title: trimmed },
            { preserveScroll: true, preserveState: true },
        );
    }

    const showOverlay = mode === 'overlay' && comparison.is_overlayable;

    return (
        <>
            <Head title={comparison.title} />

            <div className="flex h-[calc(100svh-4rem)] flex-col">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-2.5">
                    <div className="flex min-w-0 items-center gap-2">
                        <Button variant="ghost" size="icon-sm" asChild>
                            <Link href={index().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">
                                    Back to Smart Comparison
                                </span>
                            </Link>
                        </Button>
                        <input
                            key={comparison.title}
                            defaultValue={comparison.title}
                            readOnly={readOnly}
                            aria-label="Comparison title"
                            onBlur={(e) => rename(e.target.value)}
                            onKeyDown={(e) =>
                                e.key === 'Enter' && e.currentTarget.blur()
                            }
                            className="font-heading hover:bg-muted/60 focus:bg-muted/60 min-w-0 rounded-md bg-transparent px-1.5 py-0.5 text-lg font-semibold tracking-tight outline-none read-only:hover:bg-transparent"
                        />
                        <Badge variant="outline" className="shrink-0">
                            {comparison.project.name}
                        </Badge>
                        <span className="text-muted-foreground hidden shrink-0 text-xs sm:inline">
                            Started by {comparison.creator.name}
                        </span>
                        {readOnly && (
                            <Badge variant="secondary" className="shrink-0">
                                View only
                            </Badge>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        <Tabs
                            value={mode}
                            onValueChange={(v) =>
                                changeMode(v as ComparisonMode)
                            }
                        >
                            <TabsList>
                                <TabsTrigger value="side_by_side">
                                    <Columns2 className="size-4" />
                                    Side by side
                                </TabsTrigger>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span>
                                            <TabsTrigger
                                                value="overlay"
                                                disabled={
                                                    !comparison.is_overlayable
                                                }
                                            >
                                                <SquareStack className="size-4" />
                                                Overlay
                                            </TabsTrigger>
                                        </span>
                                    </TooltipTrigger>
                                    {!comparison.is_overlayable && (
                                        <TooltipContent side="bottom">
                                            Overlay works with two images
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            </TabsList>
                        </Tabs>

                        {can.manageReviewers && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShareOpen(true)}
                            >
                                <Share2 className="size-4" />
                                Share
                            </Button>
                        )}

                        {can.delete && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon-sm">
                                        <MoreHorizontal className="size-4" />
                                        <span className="sr-only">
                                            Comparison actions
                                        </span>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        variant="destructive"
                                        onSelect={() => setDeleting(true)}
                                    >
                                        <Trash2 className="size-4" />
                                        Delete comparison
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                </div>

                {/* Toolbar */}
                <div className="bg-muted/30 flex flex-wrap items-center justify-between gap-2 border-b px-4 py-1.5">
                    <div className="flex items-center gap-1.5">
                        {!readOnly && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={
                                            commentTool ? 'default' : 'ghost'
                                        }
                                        size="sm"
                                        onClick={toggleCommentTool}
                                    >
                                        <MessageSquarePlus className="size-4" />
                                        {commentTool
                                            ? 'Click a file to pin…'
                                            : 'Add comment'}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    Click anywhere on either file to pin a
                                    comment to that spot
                                </TooltipContent>
                            </Tooltip>
                        )}
                        {showOverlay && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={blinking ? 'default' : 'ghost'}
                                        size="sm"
                                        onClick={() => setBlinking((v) => !v)}
                                    >
                                        <Zap className="size-4" />
                                        Blink compare
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent side="bottom">
                                    Rapidly flips between both files in place -
                                    handy for spotting small changes
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>

                    <div className="flex items-center gap-0.5">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={zoomPan.zoomOut}
                        >
                            <ZoomOut className="size-4" />
                            <span className="sr-only">Zoom out</span>
                        </Button>
                        <span className="text-muted-foreground w-12 text-center text-xs tabular-nums">
                            {Math.round(zoomPan.transform.scale * 100)}%
                        </span>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={zoomPan.zoomIn}
                        >
                            <ZoomIn className="size-4" />
                            <span className="sr-only">Zoom in</span>
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={zoomPan.reset}
                        >
                            <RotateCcw className="size-4" />
                            <span className="sr-only">Reset view</span>
                        </Button>
                    </div>
                </div>

                {/* Workspace */}
                <div className="flex min-h-0 flex-1">
                    <div ref={centerRef} className="flex min-h-0 flex-1">
                        {showOverlay && leftFile && rightFile ? (
                            <ComparisonOverlay
                                leftFile={leftFile}
                                rightFile={rightFile}
                                transform={zoomPan.transform}
                                blinking={blinking}
                                onWheel={zoomPan.handleWheel}
                                onPointerDown={zoomPan.handlePointerDown}
                                onPointerMove={zoomPan.handlePointerMove}
                                onPointerUpMoved={zoomPan.handlePointerUp}
                                onNaturalSize={() =>
                                    setNaturalSizes((s) => ({
                                        ...s,
                                        left: true,
                                        right: true,
                                    }))
                                }
                            />
                        ) : (
                            <div className="grid min-h-0 flex-1 grid-cols-2 divide-x">
                                <ComparisonPane
                                    file={leftFile}
                                    transform={zoomPan.transform}
                                    pins={leftPins}
                                    activePinId={activeAnnotationId}
                                    placingPin={commentTool}
                                    onPlacePin={(x, y) =>
                                        handlePlacePin('left', x, y)
                                    }
                                    onPinClick={setActiveAnnotationId}
                                    onWheel={zoomPan.handleWheel}
                                    onPointerDown={zoomPan.handlePointerDown}
                                    onPointerMove={zoomPan.handlePointerMove}
                                    onPointerUpMoved={zoomPan.handlePointerUp}
                                    onNaturalSize={() =>
                                        setNaturalSizes((s) => ({
                                            ...s,
                                            left: true,
                                        }))
                                    }
                                    loading={!!leftFile && !naturalSizes.left}
                                    emptyLabel="Choose the left file"
                                    onPickFile={() => setPickingFor('left')}
                                    header={
                                        <PaneHeader
                                            label="Left"
                                            file={leftFile}
                                            canManage={!readOnly}
                                            onReplace={() =>
                                                setPickingFor('left')
                                            }
                                        />
                                    }
                                />
                                <ComparisonPane
                                    file={rightFile}
                                    transform={zoomPan.transform}
                                    pins={rightPins}
                                    activePinId={activeAnnotationId}
                                    placingPin={commentTool}
                                    onPlacePin={(x, y) =>
                                        handlePlacePin('right', x, y)
                                    }
                                    onPinClick={setActiveAnnotationId}
                                    onWheel={zoomPan.handleWheel}
                                    onPointerDown={zoomPan.handlePointerDown}
                                    onPointerMove={zoomPan.handlePointerMove}
                                    onPointerUpMoved={zoomPan.handlePointerUp}
                                    onNaturalSize={() =>
                                        setNaturalSizes((s) => ({
                                            ...s,
                                            right: true,
                                        }))
                                    }
                                    loading={!!rightFile && !naturalSizes.right}
                                    emptyLabel="Choose the right file"
                                    onPickFile={() => setPickingFor('right')}
                                    header={
                                        <PaneHeader
                                            label="Right"
                                            file={rightFile}
                                            canManage={!readOnly}
                                            onReplace={() =>
                                                setPickingFor('right')
                                            }
                                        />
                                    }
                                />
                            </div>
                        )}
                    </div>

                    <aside className="bg-background hidden w-80 shrink-0 flex-col border-l md:flex">
                        <div className="flex items-center gap-2 border-b px-3 py-2.5">
                            <MessagesSquare className="text-muted-foreground size-4" />
                            <p className="text-sm font-medium">Comments</p>
                        </div>

                        {draftPin && (
                            <div className="space-y-2 border-b p-3">
                                <p className="text-muted-foreground text-xs font-medium">
                                    New pin on the {draftPin.side} file
                                </p>
                                <Textarea
                                    value={draftBody}
                                    onChange={(e) =>
                                        setDraftBody(e.target.value)
                                    }
                                    placeholder="What should reviewers notice here?"
                                    rows={3}
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setDraftPin(null)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={posting || !draftBody.trim()}
                                        onClick={submitDraft}
                                    >
                                        Post
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="min-h-0 flex-1">
                            <CommentsPanel
                                comparisonId={comparison.id}
                                threads={threads}
                                activeId={activeAnnotationId}
                                onFocus={(a) => setActiveAnnotationId(a.id)}
                                currentUserId={currentUserId}
                                canManage={can.update}
                                readOnly={readOnly}
                            />
                        </div>
                    </aside>
                </div>
            </div>

            <PickFileDialog
                open={pickingFor !== null}
                onOpenChange={(open) => !open && setPickingFor(null)}
                files={otherFiles}
                title={
                    pickingFor === 'left'
                        ? 'Choose the left file'
                        : 'Choose the right file'
                }
                onPick={pickFile}
            />

            <ShareComparisonDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                comparisonId={comparison.id}
                reviewers={reviewers}
                elevationUsers={elevationUsers}
            />

            <ConfirmDeleteDialog
                open={deleting}
                onOpenChange={setDeleting}
                title="Delete comparison?"
                description="This permanently deletes this comparison and every comment on it. The original files are untouched."
                formAction={destroy.form(comparison.id)}
                onSuccess={() => setDeleting(false)}
            />
        </>
    );
}

function PaneHeader({
    label,
    file,
    canManage,
    onReplace,
}: {
    label: string;
    file: ComparisonFileSummary | null;
    canManage: boolean;
    onReplace: () => void;
}) {
    return (
        <div className="flex items-center justify-between gap-2 border-b px-3 py-2">
            <div className="min-w-0">
                <p className="text-muted-foreground text-[10px] font-semibold tracking-wide uppercase">
                    {label}
                </p>
                {file ? (
                    <>
                        <p className="truncate text-sm font-medium">
                            {file.name}
                        </p>
                        <FileMeta file={file} />
                    </>
                ) : (
                    <p className="text-muted-foreground text-sm">No file yet</p>
                )}
            </div>
            {file && canManage && (
                <Button variant="ghost" size="sm" onClick={onReplace}>
                    Replace
                </Button>
            )}
        </div>
    );
}

ComparisonShow.layout = (page: unknown) => {
    const props = page as
        | {
              comparison?: ComparisonDetail;
              props?: { comparison?: ComparisonDetail };
          }
        | undefined;
    const comparison = props?.props?.comparison ?? props?.comparison;

    return (
        <AppLayout
            breadcrumbs={
                comparison
                    ? [
                          { title: 'Smart Comparison', href: index() },
                          {
                              title: comparison.title,
                              href: show(comparison.id),
                          },
                      ]
                    : [{ title: 'Smart Comparison', href: index() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
