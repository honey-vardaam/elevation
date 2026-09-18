import { Head, Link, router } from '@inertiajs/react';
import {
    Background,
    BackgroundVariant,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useNodesState,
    useReactFlow,
    type Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    type ChangeEvent,
    type DragEvent,
    type ReactNode,
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import {
    ArrowLeft,
    Check,
    CloudOff,
    Copy,
    Frame,
    ImagePlus,
    ListChecks,
    Loader2,
    MoreHorizontal,
    Pencil,
    Share2,
    Smile,
    StickyNote,
    Trash2,
    Type,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    CanvasContext,
    type CanvasNode,
    nodeTypes,
} from '@/components/moodboards/moodboard-canvas-nodes';
import { ShareMoodboardDialog } from '@/components/moodboards/share-moodboard-dialog';
import { ConfirmDeleteDialog } from '@/components/confirm-delete-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useAppearance } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import { randomId } from '@/lib/id';
import { cn } from '@/lib/utils';
import { canvas, destroy, index, show, update } from '@/routes/moodboards';
import { store as storeImage } from '@/routes/moodboards/images';
import type {
    MoodboardColor,
    MoodboardDetail,
    MoodboardElement,
    MoodboardElementData,
    MoodboardElementType,
} from '@/types';

/** Sections always render beneath everything else on the board, but above the canvas pane. */
const REGULAR_Z_OFFSET = 10000;

const EMOJI_STICKERS = [
    '👍',
    '❤️',
    '⭐',
    '🔥',
    '✅',
    '❗',
    '💡',
    '🎯',
    '📌',
    '🚧',
    '🎉',
    '👀',
];
const LABEL_STICKERS: { label: string; color: MoodboardColor }[] = [
    { label: 'Approved', color: 'green' },
    { label: 'Urgent', color: 'pink' },
    { label: 'In review', color: 'blue' },
    { label: 'Idea', color: 'yellow' },
    { label: 'Blocked', color: 'orange' },
    { label: 'Done', color: 'purple' },
];

const DEFAULT_SIZES: Record<
    MoodboardElementType,
    { width: number; height: number }
> = {
    checklist: { width: 300, height: 280 },
    note: { width: 220, height: 220 },
    text: { width: 280, height: 56 },
    image: { width: 280, height: 200 },
    sticker: { width: 72, height: 72 },
    section: { width: 640, height: 440 },
};

function defaultSize(
    type: MoodboardElementType,
    data: MoodboardElementData,
): { width: number; height: number } {
    return type === 'sticker' && data.label
        ? { width: 150, height: 40 }
        : DEFAULT_SIZES[type];
}

function toNode(element: MoodboardElement): CanvasNode {
    const fallback = defaultSize(element.type, element.data);

    return {
        id: element.id,
        type: element.type,
        position: { x: element.x, y: element.y },
        width: element.width ?? fallback.width,
        height: element.height ?? fallback.height,
        zIndex:
            element.type === 'section'
                ? Math.max(1, element.z_index)
                : Math.max(1, element.z_index) + REGULAR_Z_OFFSET,
        data: element.data,
    };
}

function toElement(node: CanvasNode): MoodboardElement {
    const { url: _url, ...data } = node.data;
    const z = node.zIndex ?? 1;

    return {
        id: node.id,
        type: node.type as MoodboardElementType,
        x: Math.round(node.position.x),
        y: Math.round(node.position.y),
        width: node.width ? Math.round(node.width) : null,
        height: node.height ? Math.round(node.height) : null,
        z_index:
            node.type === 'section'
                ? Math.max(1, z)
                : Math.max(1, z >= REGULAR_Z_OFFSET ? z - REGULAR_Z_OFFSET : z),
        data,
    };
}

function xsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function jsonHeaders(): Record<string, string> {
    return {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': xsrfToken(),
    };
}

type SaveStatus = 'saved' | 'pending' | 'saving' | 'error';

/**
 * New elements always drop at the current viewport center, so adding
 * several in a row would otherwise stack them exactly on top of each
 * other - making the ones underneath unreachable by click. Cascade each
 * successive drop a little so they fan out instead.
 */
const SPAWN_CASCADE_STEP = 28;
const SPAWN_CASCADE_MAX = 8;

export default function MoodboardShow(props: {
    moodboard: MoodboardDetail;
    elements: MoodboardElement[];
    can: { update: boolean; delete: boolean };
    manageableProjects?: { id: number; name: string }[];
}) {
    return (
        <ReactFlowProvider>
            <Board {...props} />
        </ReactFlowProvider>
    );
}

function Board({
    moodboard,
    elements,
    can,
    manageableProjects = [],
}: {
    moodboard: MoodboardDetail;
    elements: MoodboardElement[];
    can: { update: boolean; delete: boolean };
    manageableProjects?: { id: number; name: string }[];
}) {
    const readOnly = !can.update;
    const { resolvedAppearance } = useAppearance();
    const { screenToFlowPosition, getNodes } = useReactFlow();
    const [nodes, setNodes, onNodesChange] = useNodesState<CanvasNode>(
        useMemo(() => elements.map(toNode), [elements]),
    );
    const [deleting, setDeleting] = useState(false);
    const [uploading, setUploading] = useState(0);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [titleDraft, setTitleDraft] = useState(moodboard.title);
    const [shareOpen, setShareOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const titleInputRef = useRef<HTMLInputElement>(null);
    const spawnCount = useRef(0);

    const saveStatus = useAutosave(moodboard.id, nodes, readOnly);

    const updateData = useCallback(
        (id: string, patch: Partial<MoodboardElementData>) => {
            setNodes((current) =>
                current.map((node) =>
                    node.id === id
                        ? { ...node, data: { ...node.data, ...patch } }
                        : node,
                ),
            );
        },
        [setNodes],
    );

    const remove = useCallback(
        (id: string) =>
            setNodes((current) => current.filter((node) => node.id !== id)),
        [setNodes],
    );

    const nextZ = useCallback(
        (type: string, current: CanvasNode[]) => {
            const isSection = type === 'section';
            const base = isSection ? 0 : REGULAR_Z_OFFSET;
            const relevant = current.filter(
                (node) => (node.type === 'section') === isSection,
            );
            return (
                Math.max(base, ...relevant.map((node) => node.zIndex ?? base)) +
                1
            );
        },
        [],
    );

    const bringToFront = useCallback(
        (id: string) =>
            setNodes((current) => {
                const target = current.find((node) => node.id === id);
                if (!target) {
                    return current;
                }
                const z = nextZ(target.type ?? '', current);
                return current.map((node) =>
                    node.id === id ? { ...node, zIndex: z } : node,
                );
            }),
        [setNodes, nextZ],
    );

    const duplicate = useCallback(
        (id: string) =>
            setNodes((current) => {
                const source = current.find((node) => node.id === id);
                if (!source) {
                    return current;
                }
                const copy: CanvasNode = {
                    ...source,
                    id: randomId(),
                    position: {
                        x: source.position.x + 24,
                        y: source.position.y + 24,
                    },
                    zIndex: nextZ(source.type ?? '', current),
                    selected: true,
                    data: structuredClone(source.data),
                };
                return [
                    ...current.map((node) => ({ ...node, selected: false })),
                    copy,
                ];
            }),
        [setNodes, nextZ],
    );

    const actions = useMemo(
        () => ({ readOnly, updateData, remove, duplicate, bringToFront }),
        [readOnly, updateData, remove, duplicate, bringToFront],
    );

    const addElement = useCallback(
        (
            type: MoodboardElementType,
            data: MoodboardElementData,
            options: {
                at?: { x: number; y: number };
                size?: { width: number; height: number };
            } = {},
        ) => {
            const size = options.size ?? defaultSize(type, data);
            let at = options.at;

            if (!at) {
                const rect = wrapperRef.current?.getBoundingClientRect();
                const cascade =
                    (spawnCount.current % SPAWN_CASCADE_MAX) *
                    SPAWN_CASCADE_STEP;
                spawnCount.current += 1;

                at = rect
                    ? screenToFlowPosition({
                          x: rect.left + rect.width / 2 + cascade,
                          y: rect.top + rect.height / 2 + cascade,
                      })
                    : { x: cascade, y: cascade };
            }

            setNodes((current) => [
                ...current.map((node) => ({ ...node, selected: false })),
                {
                    id: randomId(),
                    type,
                    position: {
                        x: at.x - size.width / 2,
                        y: at.y - size.height / 2,
                    },
                    width: size.width,
                    height: size.height,
                    zIndex: nextZ(type, current),
                    selected: true,
                    data,
                },
            ]);
        },
        [screenToFlowPosition, setNodes, nextZ],
    );

    const uploadImages = useCallback(
        async (files: File[], at?: { x: number; y: number }) => {
            const images = files.filter((file) =>
                file.type.startsWith('image/'),
            );

            for (const [i, file] of images.entries()) {
                setUploading((count) => count + 1);

                try {
                    const body = new FormData();
                    body.append('image', file);
                    const response = await fetch(storeImage(moodboard.id).url, {
                        method: 'POST',
                        headers: jsonHeaders(),
                        credentials: 'same-origin',
                        body,
                    });

                    if (!response.ok) {
                        throw new Error();
                    }

                    const { path, url } = (await response.json()) as {
                        path: string;
                        url: string;
                    };
                    const size = await imageSize(url);

                    addElement(
                        'image',
                        { path, url },
                        {
                            size,
                            at: at
                                ? { x: at.x + i * 24, y: at.y + i * 24 }
                                : undefined,
                        },
                    );
                } catch {
                    toast.error(`Couldn't upload ${file.name}.`);
                } finally {
                    setUploading((count) => count - 1);
                }
            }
        },
        [moodboard.id, addElement],
    );

    function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
        void uploadImages(Array.from(event.target.files ?? []));
        event.target.value = '';
    }

    function handleDrop(event: DragEvent<HTMLDivElement>) {
        if (readOnly || event.dataTransfer.files.length === 0) {
            return;
        }

        event.preventDefault();
        void uploadImages(
            Array.from(event.dataTransfer.files),
            screenToFlowPosition({ x: event.clientX, y: event.clientY }),
        );
    }

    useEffect(() => {
        if (readOnly) {
            return;
        }

        function handlePaste(event: ClipboardEvent) {
            const target = event.target as HTMLElement | null;
            if (target?.closest('input, textarea, [contenteditable="true"]')) {
                return;
            }

            const files = Array.from(event.clipboardData?.files ?? []);
            if (files.length > 0) {
                event.preventDefault();
                void uploadImages(files);
            }
        }

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [readOnly, uploadImages]);

    // Dragging a section carries everything sitting inside it, the way
    // FigJam sections do - captured at drag start so items don't get
    // "picked up" as the section sweeps over them mid-drag.
    const sectionDrag = useRef<{
        start: { x: number; y: number };
        children: Map<string, { x: number; y: number }>;
    } | null>(null);

    function handleNodeDragStart(_event: unknown, node: Node) {
        if (node.type !== 'section') {
            sectionDrag.current = null;
            return;
        }

        const width = node.width ?? 0;
        const height = node.height ?? 0;
        const children = new Map<string, { x: number; y: number }>();

        for (const other of getNodes()) {
            if (other.id === node.id || other.selected) {
                continue;
            }
            const inside =
                other.position.x >= node.position.x &&
                other.position.y >= node.position.y &&
                other.position.x + (other.width ?? 0) <=
                    node.position.x + width &&
                other.position.y + (other.height ?? 0) <=
                    node.position.y + height;

            if (inside) {
                children.set(other.id, { ...other.position });
            }
        }

        sectionDrag.current = { start: { ...node.position }, children };
    }

    function handleNodeDrag(_event: unknown, node: Node) {
        const drag = sectionDrag.current;
        if (!drag || node.type !== 'section' || drag.children.size === 0) {
            return;
        }

        const dx = node.position.x - drag.start.x;
        const dy = node.position.y - drag.start.y;

        setNodes((current) =>
            current.map((other) => {
                const origin = drag.children.get(other.id);
                return origin
                    ? {
                          ...other,
                          position: { x: origin.x + dx, y: origin.y + dy },
                      }
                    : other;
            }),
        );
    }

    const rename = useCallback(
        (title: string) => {
            const trimmed = title.trim();
            if (!trimmed || trimmed === moodboard.title) {
                return;
            }

            router.patch(
                update(moodboard.id).url,
                { title: trimmed },
                { preserveScroll: true, preserveState: true },
            );
        },
        [moodboard.id, moodboard.title],
    );

    useEffect(() => {
        setTitleDraft(moodboard.title);
    }, [moodboard.title]);

    useEffect(() => {
        if (isEditingTitle) {
            titleInputRef.current?.focus();
            titleInputRef.current?.select();
        }
    }, [isEditingTitle]);

    const handleCommitRename = useCallback(() => {
        setIsEditingTitle(false);
        const trimmed = titleDraft.trim();
        if (!trimmed) {
            setTitleDraft(moodboard.title);
            return;
        }
        if (trimmed !== moodboard.title) {
            rename(trimmed);
        }
    }, [titleDraft, moodboard.title, rename]);

    const handleCancelRename = useCallback(() => {
        setTitleDraft(moodboard.title);
        setIsEditingTitle(false);
    }, [moodboard.title]);

    return (
        <CanvasContext.Provider value={actions}>
            <Head title={moodboard.title} />

            <div className="flex h-[calc(100svh-4rem)] flex-col">
                <div className="flex items-center justify-between gap-3 border-b px-4 py-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon-sm"
                            asChild
                            className="shrink-0"
                        >
                            <Link href={index().url}>
                                <ArrowLeft className="size-4" />
                                <span className="sr-only">
                                    Back to moodboards
                                </span>
                            </Link>
                        </Button>

                        {isEditingTitle && !readOnly ? (
                            <input
                                ref={titleInputRef}
                                value={titleDraft}
                                onChange={(e) => setTitleDraft(e.target.value)}
                                onBlur={handleCommitRename}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleCommitRename();
                                    } else if (e.key === 'Escape') {
                                        handleCancelRename();
                                    }
                                }}
                                aria-label="Moodboard title"
                                className="h-7 min-w-[140px] max-w-sm rounded-md border border-input bg-background px-2 py-0.5 text-sm font-medium text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30"
                            />
                        ) : (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span
                                        onDoubleClick={() => {
                                            if (!readOnly) {
                                                setIsEditingTitle(true);
                                            }
                                        }}
                                        className={cn(
                                            'min-w-0 truncate rounded-md px-1.5 py-0.5 text-sm font-medium text-foreground transition-colors',
                                            !readOnly &&
                                                'cursor-pointer hover:bg-muted/60 select-none',
                                        )}
                                    >
                                        {moodboard.title}
                                    </span>
                                </TooltipTrigger>
                                {!readOnly && (
                                    <TooltipContent side="bottom">
                                        Double-click to rename
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        )}

                        <Badge
                            variant="outline"
                            className="shrink-0 text-xs font-normal"
                        >
                            {moodboard.project
                                ? moodboard.project.name
                                : 'Personal'}
                        </Badge>
                        {readOnly && (
                            <Badge
                                variant="secondary"
                                className="shrink-0 text-xs font-normal"
                            >
                                View only
                            </Badge>
                        )}
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                        {!readOnly && <SaveIndicator status={saveStatus} />}

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon-sm">
                                    <MoreHorizontal className="size-4" />
                                    <span className="sr-only">
                                        Board actions
                                    </span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                                <DropdownMenuItem
                                    onSelect={() => setShareOpen(true)}
                                >
                                    <Share2 className="mr-2 size-4" />
                                    Share moodboard
                                </DropdownMenuItem>
                                {!readOnly && (
                                    <DropdownMenuItem
                                        onSelect={() =>
                                            setIsEditingTitle(true)
                                        }
                                    >
                                        <Pencil className="mr-2 size-4" />
                                        Rename title
                                    </DropdownMenuItem>
                                )}
                                {can.delete && (
                                    <>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            variant="destructive"
                                            onSelect={() => setDeleting(true)}
                                        >
                                            <Trash2 className="mr-2 size-4" />
                                            Delete moodboard
                                        </DropdownMenuItem>
                                    </>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div
                    ref={wrapperRef}
                    className="relative min-h-0 flex-1"
                    onDragOver={(e) => !readOnly && e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <ReactFlow
                        nodes={nodes}
                        onNodesChange={onNodesChange}
                        nodeTypes={nodeTypes}
                        onNodeDragStart={handleNodeDragStart}
                        onNodeDrag={handleNodeDrag}
                        nodesDraggable={!readOnly}
                        nodesConnectable={false}
                        elementsSelectable={!readOnly}
                        deleteKeyCode={
                            readOnly ? null : ['Backspace', 'Delete']
                        }
                        selectionOnDrag={!readOnly}
                        panOnDrag={readOnly ? true : [1, 2]}
                        panOnScroll
                        zoomOnScroll={false}
                        minZoom={0.1}
                        maxZoom={4}
                        colorMode={resolvedAppearance}
                        proOptions={{ hideAttribution: true }}
                        fitView={nodes.length > 0}
                        fitViewOptions={{ padding: 0.2, maxZoom: 1 }}
                    >
                        <Background
                            variant={BackgroundVariant.Dots}
                            gap={20}
                            size={1.2}
                        />
                        <Controls showInteractive={false} />
                        <MiniMap
                            pannable
                            zoomable
                            className="hidden md:block"
                        />
                    </ReactFlow>

                    {nodes.length === 0 && (
                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center p-6">
                            <div className="text-muted-foreground max-w-sm text-center text-sm">
                                <p className="text-foreground font-medium">
                                    {readOnly
                                        ? 'This moodboard is empty.'
                                        : 'A blank canvas.'}
                                </p>
                                {!readOnly && (
                                    <p className="mt-1">
                                        Pin material references, color palettes
                                        and notes from the toolbar below — or
                                        paste and drop images straight onto the
                                        board.
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    {!readOnly && (
                        <CanvasToolbar
                            uploading={uploading > 0}
                            onAdd={addElement}
                            onPickImage={() => fileInputRef.current?.click()}
                        />
                    )}

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        hidden
                        onChange={handleFileInput}
                    />
                </div>
            </div>

            <ConfirmDeleteDialog
                open={deleting}
                onOpenChange={setDeleting}
                title="Delete moodboard?"
                description={
                    <>
                        This permanently deletes{' '}
                        <span className="text-foreground font-medium">
                            {moodboard.title}
                        </span>{' '}
                        and everything on its board, including uploaded images.
                    </>
                }
                formAction={destroy.form(moodboard.id)}
                onSuccess={() => setDeleting(false)}
            />

            <ShareMoodboardDialog
                open={shareOpen}
                onOpenChange={setShareOpen}
                moodboard={moodboard}
                manageableProjects={manageableProjects}
                canManage={can.update}
            />
        </CanvasContext.Provider>
    );
}

function imageSize(url: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve) => {
        const image = new Image();
        image.onload = () => {
            const width = Math.min(320, image.naturalWidth || 320);
            const ratio = image.naturalHeight / (image.naturalWidth || 1);
            resolve({ width, height: Math.max(40, Math.round(width * ratio)) });
        };
        image.onerror = () => resolve(DEFAULT_SIZES.image);
        image.src = url;
    });
}

/**
 * Debounced full-board autosave. Only persisted fields feed the diff, so
 * selecting or hovering never triggers a save; saves are queued so an
 * older request can never land after a newer one.
 */
function useAutosave(
    moodboardId: number,
    nodes: CanvasNode[],
    readOnly: boolean,
): SaveStatus {
    const serialized = useMemo(
        () => JSON.stringify(nodes.map(toElement)),
        [nodes],
    );
    const [status, setStatus] = useState<SaveStatus>('saved');
    const lastSaved = useRef(serialized);
    const latest = useRef(serialized);
    const queue = useRef<Promise<void>>(Promise.resolve());

    latest.current = serialized;

    const save = useCallback(
        (payload: string, keepalive = false) => {
            queue.current = queue.current.then(async () => {
                if (payload === lastSaved.current) {
                    return;
                }

                setStatus('saving');

                try {
                    const response = await fetch(canvas(moodboardId).url, {
                        method: 'PUT',
                        headers: {
                            ...jsonHeaders(),
                            'Content-Type': 'application/json',
                        },
                        credentials: 'same-origin',
                        keepalive,
                        body: `{"elements":${payload}}`,
                    });

                    if (!response.ok) {
                        throw new Error(String(response.status));
                    }

                    lastSaved.current = payload;
                    setStatus(latest.current === payload ? 'saved' : 'pending');
                } catch {
                    setStatus('error');
                    toast.error(
                        "Couldn't save your changes. Retrying on your next edit.",
                    );
                }
            });
        },
        [moodboardId],
    );

    useEffect(() => {
        if (readOnly || serialized === lastSaved.current) {
            return;
        }

        setStatus('pending');
        const timeout = setTimeout(() => save(serialized), 700);
        return () => clearTimeout(timeout);
    }, [serialized, readOnly, save]);

    useEffect(() => {
        if (readOnly) {
            return;
        }

        function warnIfUnsaved(event: BeforeUnloadEvent) {
            if (latest.current !== lastSaved.current) {
                event.preventDefault();
            }
        }

        window.addEventListener('beforeunload', warnIfUnsaved);

        return () => {
            window.removeEventListener('beforeunload', warnIfUnsaved);
            // Leaving via in-app navigation: flush whatever the debounce
            // was still holding.
            if (latest.current !== lastSaved.current) {
                save(latest.current, true);
            }
        };
    }, [readOnly, save]);

    return status;
}

function SaveIndicator({ status }: { status: SaveStatus }) {
    const content: Record<SaveStatus, ReactNode> = {
        saved: (
            <>
                <Check className="size-3.5" /> Saved
            </>
        ),
        pending: <>Unsaved changes</>,
        saving: (
            <>
                <Loader2 className="size-3.5 animate-spin" /> Saving…
            </>
        ),
        error: (
            <>
                <CloudOff className="size-3.5" /> Not saved
            </>
        ),
    };

    return (
        <span
            className={cn(
                'text-muted-foreground flex items-center gap-1 text-xs',
                status === 'error' && 'text-destructive',
            )}
        >
            {content[status]}
        </span>
    );
}

function ToolButton({
    label,
    onClick,
    children,
}: {
    label: string;
    onClick?: () => void;
    children: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-xl"
                    onClick={onClick}
                >
                    {children}
                    <span className="sr-only">{label}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{label}</TooltipContent>
        </Tooltip>
    );
}

function CanvasToolbar({
    uploading,
    onAdd,
    onPickImage,
}: {
    uploading: boolean;
    onAdd: (type: MoodboardElementType, data: MoodboardElementData) => void;
    onPickImage: () => void;
}) {
    return (
        <div className="absolute bottom-5 left-1/2 z-10 -translate-x-1/2">
            <div className="bg-popover flex items-center gap-0.5 rounded-2xl border p-1.5 shadow-lg">
                <ToolButton
                    label="Checklist"
                    onClick={() =>
                        onAdd('checklist', {
                            title: '',
                            items: [
                                {
                                    id: randomId().slice(0, 8),
                                    text: '',
                                    done: false,
                                },
                            ],
                        })
                    }
                >
                    <ListChecks className="size-5" />
                </ToolButton>
                <ToolButton
                    label="Sticky note"
                    onClick={() => onAdd('note', { text: '', color: 'yellow' })}
                >
                    <StickyNote className="size-5" />
                </ToolButton>
                <ToolButton
                    label="Text"
                    onClick={() => onAdd('text', { text: '', size: 'lg' })}
                >
                    <Type className="size-5" />
                </ToolButton>
                <ToolButton label="Image" onClick={onPickImage}>
                    {uploading ? (
                        <Loader2 className="size-5 animate-spin" />
                    ) : (
                        <ImagePlus className="size-5" />
                    )}
                </ToolButton>

                <DropdownMenu>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="rounded-xl"
                                >
                                    <Smile className="size-5" />
                                    <span className="sr-only">Sticker</span>
                                </Button>
                            </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent side="top">Sticker</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent
                        side="top"
                        align="center"
                        className="w-60"
                    >
                        <DropdownMenuLabel>Stickers</DropdownMenuLabel>
                        <div className="grid grid-cols-6 gap-0.5 p-1">
                            {EMOJI_STICKERS.map((emoji) => (
                                <DropdownMenuItem
                                    key={emoji}
                                    className="justify-center text-xl"
                                    onSelect={() => onAdd('sticker', { emoji })}
                                >
                                    {emoji}
                                </DropdownMenuItem>
                            ))}
                        </div>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel>Labels</DropdownMenuLabel>
                        <div className="flex flex-wrap gap-1 p-1">
                            {LABEL_STICKERS.map(({ label, color }) => (
                                <DropdownMenuItem
                                    key={label}
                                    className="px-2 py-1 text-xs font-semibold uppercase"
                                    onSelect={() =>
                                        onAdd('sticker', { label, color })
                                    }
                                >
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                <span className="bg-border mx-1 h-6 w-px" />

                <ToolButton
                    label="Section"
                    onClick={() =>
                        onAdd('section', { title: '', color: 'gray' })
                    }
                >
                    <Frame className="size-5" />
                </ToolButton>
            </div>
        </div>
    );
}

MoodboardShow.layout = (page: unknown) => {
    const props = page as
        | {
              moodboard?: MoodboardDetail;
              props?: { moodboard?: MoodboardDetail };
          }
        | undefined;
    const moodboard = props?.props?.moodboard ?? props?.moodboard;

    return (
        <AppLayout
            breadcrumbs={
                moodboard
                    ? [
                          { title: 'Moodboards', href: index() },
                          { title: moodboard.title, href: show(moodboard.id) },
                      ]
                    : [{ title: 'Moodboards', href: index() }]
            }
        >
            {page as React.ReactNode}
        </AppLayout>
    );
};
