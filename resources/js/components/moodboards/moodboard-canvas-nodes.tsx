import {
    type Node,
    type NodeProps,
    NodeResizer,
    NodeToolbar,
    Position,
} from '@xyflow/react';
import {
    createContext,
    type KeyboardEvent,
    type ReactNode,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';
import {
    BringToFront,
    Copy,
    GripHorizontal,
    ImageOff,
    Plus,
    Trash2,
    X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { randomId } from '@/lib/id';
import { cn } from '@/lib/utils';
import type {
    ChecklistItem,
    MoodboardColor,
    MoodboardElementData,
    MoodboardElementType,
} from '@/types';

export type CanvasNode = Node<MoodboardElementData, MoodboardElementType>;

type CanvasActions = {
    readOnly: boolean;
    updateData: (id: string, patch: Partial<MoodboardElementData>) => void;
    remove: (id: string) => void;
    duplicate: (id: string) => void;
    bringToFront: (id: string) => void;
};

export const CanvasContext = createContext<CanvasActions | null>(null);

function useCanvas(): CanvasActions {
    const context = useContext(CanvasContext);

    if (!context) {
        throw new Error('Canvas nodes must render inside CanvasContext.');
    }

    return context;
}

export const COLORS: MoodboardColor[] = [
    'yellow',
    'orange',
    'pink',
    'purple',
    'blue',
    'green',
    'gray',
];

/** Sticky-note fills stay pastel in dark mode, like paper would. */
export const NOTE_STYLES: Record<MoodboardColor, string> = {
    yellow: 'bg-amber-100 text-amber-950',
    orange: 'bg-orange-100 text-orange-950',
    pink: 'bg-pink-100 text-pink-950',
    purple: 'bg-violet-100 text-violet-950',
    blue: 'bg-sky-100 text-sky-950',
    green: 'bg-emerald-100 text-emerald-950',
    gray: 'bg-zinc-100 text-zinc-900',
};

const SECTION_STYLES: Record<MoodboardColor, string> = {
    yellow: 'bg-amber-500/8 border-amber-500/40',
    orange: 'bg-orange-500/8 border-orange-500/40',
    pink: 'bg-pink-500/8 border-pink-500/40',
    purple: 'bg-violet-500/8 border-violet-500/40',
    blue: 'bg-sky-500/8 border-sky-500/40',
    green: 'bg-emerald-500/8 border-emerald-500/40',
    gray: 'bg-muted/60 border-border',
};

const SWATCH_STYLES: Record<MoodboardColor, string> = {
    yellow: 'bg-amber-300',
    orange: 'bg-orange-300',
    pink: 'bg-pink-300',
    purple: 'bg-violet-300',
    blue: 'bg-sky-300',
    green: 'bg-emerald-300',
    gray: 'bg-zinc-300',
};

const LABEL_STYLES: Record<MoodboardColor, string> = {
    yellow: 'bg-amber-400 text-amber-950',
    orange: 'bg-orange-400 text-orange-950',
    pink: 'bg-pink-400 text-pink-950',
    purple: 'bg-violet-500 text-white',
    blue: 'bg-sky-500 text-white',
    green: 'bg-emerald-500 text-white',
    gray: 'bg-zinc-700 text-white',
};

/**
 * Shared chrome for every element: a drag handle, resize handles, and a
 * floating toolbar (color, bring to front, duplicate, delete).
 *
 * The handle exists because several node types (text, checklist) fill their
 * entire box with an editable input/textarea marked `nodrag` - without a
 * dedicated always-present handle there is no pixel on those nodes left to
 * grab for moving them. It's rendered unconditionally (not gated behind
 * `selected`) since a node with zero draggable area can also never *become*
 * selected by clicking on it.
 */
function NodeFrame({
    id,
    selected,
    color,
    colorable = false,
    keepAspectRatio = false,
    minWidth = 40,
    minHeight = 40,
    children,
}: {
    id: string;
    selected: boolean;
    color?: MoodboardColor | null;
    colorable?: boolean;
    keepAspectRatio?: boolean;
    minWidth?: number;
    minHeight?: number;
    children: ReactNode;
}) {
    const { readOnly, updateData, remove, duplicate, bringToFront } =
        useCanvas();
    const editable = selected && !readOnly;

    return (
        <>
            <NodeResizer
                isVisible={editable}
                keepAspectRatio={keepAspectRatio}
                minWidth={minWidth}
                minHeight={minHeight}
                lineClassName="!border-primary"
                handleClassName="!size-2.5 !rounded-sm !border-primary !bg-background"
            />
            {!readOnly && (
                <div
                    title="Drag to move"
                    className={cn(
                        'bg-background text-muted-foreground hover:text-foreground absolute -top-3 left-1/2 z-20 flex h-5 w-7 -translate-x-1/2 cursor-grab items-center justify-center rounded-full border shadow-xs active:cursor-grabbing',
                        selected && 'text-foreground border-primary',
                    )}
                >
                    <GripHorizontal className="size-3.5" />
                </div>
            )}
            <NodeToolbar
                isVisible={editable}
                position={Position.Top}
                offset={18}
            >
                <div className="bg-popover text-popover-foreground flex items-center gap-1 rounded-full border p-1 shadow-md">
                    {colorable && (
                        <>
                            {COLORS.map((swatch) => (
                                <button
                                    key={swatch}
                                    type="button"
                                    onClick={() =>
                                        updateData(id, { color: swatch })
                                    }
                                    className={cn(
                                        'size-5 rounded-full border border-black/10 transition-transform hover:scale-110',
                                        SWATCH_STYLES[swatch],
                                        color === swatch &&
                                            'ring-foreground ring-2 ring-offset-1',
                                    )}
                                >
                                    <span className="sr-only">{swatch}</span>
                                </button>
                            ))}
                            <span className="bg-border mx-0.5 h-4 w-px" />
                        </>
                    )}
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-full"
                        onClick={() => bringToFront(id)}
                    >
                        <BringToFront className="size-3.5" />
                        <span className="sr-only">Bring to front</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="rounded-full"
                        onClick={() => duplicate(id)}
                    >
                        <Copy className="size-3.5" />
                        <span className="sr-only">Duplicate</span>
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        className="text-destructive hover:text-destructive rounded-full"
                        onClick={() => remove(id)}
                    >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">Delete</span>
                    </Button>
                </div>
            </NodeToolbar>
            {children}
        </>
    );
}

function newItemId(): string {
    return randomId().slice(0, 8);
}

export function ChecklistNode({ id, data, selected }: NodeProps<CanvasNode>) {
    const { readOnly, updateData } = useCanvas();
    const items = data.items ?? [];
    const doneCount = items.filter((item) => item.done).length;
    const listRef = useRef<HTMLUListElement>(null);
    const [focusItemId, setFocusItemId] = useState<string | null>(null);

    useEffect(() => {
        if (!focusItemId) {
            return;
        }

        listRef.current
            ?.querySelector<HTMLInputElement>(`[data-item-id="${focusItemId}"]`)
            ?.focus();
        setFocusItemId(null);
    }, [focusItemId]);

    function setItems(next: ChecklistItem[]) {
        updateData(id, { items: next });
    }

    function patchItem(itemId: string, patch: Partial<ChecklistItem>) {
        setItems(
            items.map((item) =>
                item.id === itemId ? { ...item, ...patch } : item,
            ),
        );
    }

    function insertAfter(index: number) {
        const item = { id: newItemId(), text: '', done: false };
        setItems([
            ...items.slice(0, index + 1),
            item,
            ...items.slice(index + 1),
        ]);
        setFocusItemId(item.id);
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index));
        const previous = items[index - 1];
        if (previous) {
            setFocusItemId(previous.id);
        }
    }

    function handleItemKeyDown(
        event: KeyboardEvent<HTMLInputElement>,
        index: number,
    ) {
        if (event.key === 'Enter') {
            event.preventDefault();
            insertAfter(index);
        } else if (event.key === 'Backspace' && items[index].text === '') {
            event.preventDefault();
            removeItem(index);
        }
    }

    const percent =
        items.length > 0 ? Math.round((doneCount / items.length) * 100) : 0;

    return (
        <NodeFrame id={id} selected={selected} minWidth={200} minHeight={120}>
            <div className="bg-card text-card-foreground flex h-full w-full flex-col overflow-hidden rounded-xl border shadow-sm">
                <div className="space-y-1.5 border-b px-3 pt-2.5 pb-2">
                    <input
                        className="nodrag placeholder:text-muted-foreground w-full bg-transparent text-base font-semibold outline-none"
                        value={data.title ?? ''}
                        placeholder="Checklist"
                        readOnly={readOnly}
                        onChange={(e) =>
                            updateData(id, { title: e.target.value })
                        }
                    />
                    <div className="flex items-center gap-2">
                        <div className="bg-muted h-1.5 flex-1 overflow-hidden rounded-full">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-300"
                                style={{ width: `${percent}%` }}
                            />
                        </div>
                        <span className="text-muted-foreground text-xs tabular-nums">
                            {doneCount}/{items.length}
                        </span>
                    </div>
                </div>

                <ul
                    ref={listRef}
                    className="nodrag nowheel min-h-0 flex-1 space-y-0.5 overflow-y-auto p-1.5"
                >
                    {items.map((item, index) => (
                        <li
                            key={item.id}
                            className="group/item hover:bg-muted/50 flex items-center gap-2 rounded-md px-1.5 py-1.5"
                        >
                            <Checkbox
                                checked={item.done}
                                disabled={readOnly}
                                onCheckedChange={(checked) =>
                                    patchItem(item.id, {
                                        done: checked === true,
                                    })
                                }
                            />
                            <input
                                data-item-id={item.id}
                                className={cn(
                                    'min-w-0 flex-1 bg-transparent text-base outline-none',
                                    item.done &&
                                        'text-muted-foreground line-through',
                                )}
                                value={item.text}
                                placeholder="To do"
                                readOnly={readOnly}
                                onChange={(e) =>
                                    patchItem(item.id, { text: e.target.value })
                                }
                                onKeyDown={(e) => handleItemKeyDown(e, index)}
                            />
                            {!readOnly && (
                                <button
                                    type="button"
                                    onClick={() => removeItem(index)}
                                    className="text-muted-foreground hover:text-foreground opacity-0 group-hover/item:opacity-100"
                                >
                                    <X className="size-4" />
                                    <span className="sr-only">Remove item</span>
                                </button>
                            )}
                        </li>
                    ))}
                    {!readOnly && (
                        <li>
                            <button
                                type="button"
                                onClick={() => insertAfter(items.length - 1)}
                                className="text-muted-foreground hover:text-foreground hover:bg-muted/50 flex w-full items-center gap-2 rounded-md px-1.5 py-1.5 text-base"
                            >
                                <Plus className="size-4" />
                                Add item
                            </button>
                        </li>
                    )}
                </ul>
            </div>
        </NodeFrame>
    );
}

export function NoteNode({ id, data, selected }: NodeProps<CanvasNode>) {
    const { readOnly, updateData } = useCanvas();
    const color = data.color ?? 'yellow';

    return (
        <NodeFrame
            id={id}
            selected={selected}
            color={color}
            colorable
            minWidth={120}
            minHeight={80}
        >
            <div
                className={cn(
                    'h-full w-full rounded-sm p-3 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_6px_16px_-6px_rgba(0,0,0,0.25)]',
                    NOTE_STYLES[color],
                )}
            >
                <textarea
                    className="nodrag nowheel h-full w-full resize-none bg-transparent text-base leading-relaxed outline-none placeholder:text-current/40"
                    value={data.text ?? ''}
                    placeholder="Write something…"
                    readOnly={readOnly}
                    onChange={(e) => updateData(id, { text: e.target.value })}
                />
            </div>
        </NodeFrame>
    );
}

const TEXT_SIZES = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-2xl font-semibold tracking-tight',
    xl: 'text-4xl font-semibold tracking-tight',
} as const;

export function TextNode({ id, data, selected }: NodeProps<CanvasNode>) {
    const { readOnly, updateData } = useCanvas();
    const size = data.size ?? 'md';

    return (
        <NodeFrame id={id} selected={selected} minWidth={80} minHeight={32}>
            <div
                className={cn(
                    'relative flex h-full w-full flex-col rounded-md',
                    selected && 'outline-primary/40 outline-1 outline-dashed',
                )}
            >
                {selected && !readOnly && (
                    <div className="nodrag absolute -top-7 left-0 flex gap-0.5">
                        {(
                            Object.keys(
                                TEXT_SIZES,
                            ) as (keyof typeof TEXT_SIZES)[]
                        ).map((option) => (
                            <button
                                key={option}
                                type="button"
                                onClick={() => updateData(id, { size: option })}
                                className={cn(
                                    'bg-popover rounded border px-1.5 text-[10px] font-medium uppercase',
                                    size === option &&
                                        'bg-primary text-primary-foreground',
                                )}
                            >
                                {option}
                            </button>
                        ))}
                    </div>
                )}
                <textarea
                    className={cn(
                        'nodrag nowheel placeholder:text-muted-foreground h-full w-full resize-none bg-transparent outline-none',
                        TEXT_SIZES[size],
                    )}
                    value={data.text ?? ''}
                    placeholder="Type something"
                    readOnly={readOnly}
                    onChange={(e) => updateData(id, { text: e.target.value })}
                />
            </div>
        </NodeFrame>
    );
}

export function ImageNode({ id, data, selected }: NodeProps<CanvasNode>) {
    return (
        <NodeFrame
            id={id}
            selected={selected}
            keepAspectRatio
            minWidth={60}
            minHeight={60}
        >
            {data.url ? (
                <img
                    src={data.url}
                    alt=""
                    draggable={false}
                    className="h-full w-full rounded-md object-cover shadow-sm"
                />
            ) : (
                <div className="bg-muted text-muted-foreground flex h-full w-full items-center justify-center rounded-md">
                    <ImageOff className="size-6" />
                </div>
            )}
        </NodeFrame>
    );
}

export function StickerNode({
    id,
    data,
    selected,
    height,
}: NodeProps<CanvasNode>) {
    const color = data.color ?? 'yellow';
    const size = height ?? 72;

    if (data.label) {
        return (
            <NodeFrame
                id={id}
                selected={selected}
                color={color}
                colorable
                minWidth={60}
                minHeight={24}
            >
                <div
                    className={cn(
                        'flex h-full w-full -rotate-3 items-center justify-center rounded-full px-3 font-bold whitespace-nowrap uppercase shadow-md',
                        LABEL_STYLES[color],
                    )}
                    style={{ fontSize: Math.max(13, size * 0.42) }}
                >
                    {data.label}
                </div>
            </NodeFrame>
        );
    }

    return (
        <NodeFrame
            id={id}
            selected={selected}
            keepAspectRatio
            minWidth={24}
            minHeight={24}
        >
            <div
                className="flex h-full w-full items-center justify-center leading-none drop-shadow-sm select-none"
                style={{ fontSize: size * 0.8 }}
            >
                {data.emoji}
            </div>
        </NodeFrame>
    );
}

export function SectionNode({ id, data, selected }: NodeProps<CanvasNode>) {
    const { readOnly, updateData, remove } = useCanvas();
    const color = data.color ?? 'gray';
    const [colorMenuOpen, setColorMenuOpen] = useState(false);

    return (
        <NodeFrame
            id={id}
            selected={selected}
            color={color}
            colorable
            minWidth={160}
            minHeight={120}
        >
            <div
                className={cn(
                    'relative h-full w-full rounded-2xl border-2 transition-colors',
                    SECTION_STYLES[color],
                )}
            >
                <div
                    className={cn(
                        'nodrag bg-background/95 absolute -top-4 left-4 z-10 flex items-center gap-1.5 rounded-lg border px-2.5 py-1 shadow-xs backdrop-blur-xs transition-all',
                        selected && 'ring-primary/40 border-primary ring-2',
                    )}
                >
                    <input
                        className="placeholder:text-muted-foreground min-w-[60px] bg-transparent text-sm font-semibold text-foreground outline-none"
                        value={data.title ?? ''}
                        placeholder="Section"
                        readOnly={readOnly}
                        size={Math.max(6, (data.title ?? '').length + 1)}
                        onChange={(e) =>
                            updateData(id, { title: e.target.value })
                        }
                    />

                    {!readOnly && (
                        <div className="flex items-center gap-1 border-l pl-1.5">
                            <DropdownMenu
                                open={colorMenuOpen}
                                onOpenChange={setColorMenuOpen}
                            >
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        title="Change section color"
                                        className="flex items-center gap-1 rounded p-0.5 hover:bg-muted"
                                    >
                                        <span
                                            className={cn(
                                                'size-3.5 rounded-full border border-black/10',
                                                SWATCH_STYLES[color],
                                            )}
                                        />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="flex items-center gap-1 p-1.5"
                                >
                                    {COLORS.map((swatch) => (
                                        <button
                                            key={swatch}
                                            type="button"
                                            onClick={() => {
                                                updateData(id, {
                                                    color: swatch,
                                                });
                                                setColorMenuOpen(false);
                                            }}
                                            className={cn(
                                                'size-5 rounded-full border border-black/10 transition-transform hover:scale-110',
                                                SWATCH_STYLES[swatch],
                                                color === swatch &&
                                                    'ring-foreground ring-2 ring-offset-1',
                                            )}
                                        >
                                            <span className="sr-only">
                                                {swatch}
                                            </span>
                                        </button>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <button
                                type="button"
                                title="Delete section"
                                onClick={() => remove(id)}
                                className="text-muted-foreground hover:text-destructive flex size-5 items-center justify-center rounded transition-colors hover:bg-destructive/10"
                            >
                                <Trash2 className="size-3.5" />
                                <span className="sr-only">Delete section</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </NodeFrame>
    );
}

export const nodeTypes = {
    checklist: ChecklistNode,
    note: NoteNode,
    text: TextNode,
    image: ImageNode,
    sticker: StickerNode,
    section: SectionNode,
};
