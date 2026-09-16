import {
    DndContext,
    type DragEndEvent,
    KeyboardSensor,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    SortableContext,
    arrayMove,
    rectSortingStrategy,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { SortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { CSSProperties, ReactNode } from 'react';

type DragHandle = Pick<
    ReturnType<typeof useSortable>,
    'attributes' | 'listeners'
> & {
    ref: ReturnType<typeof useSortable>['setActivatorNodeRef'];
};

/**
 * A pointer + keyboard sortable list built on dnd-kit: items animate into
 * place as you drag (unlike native HTML5 DnD, which only shows a static
 * ghost), and the grip handle works with touch as well as a mouse. Callers
 * own all item markup - this only supplies the reorder mechanics and hands
 * back `dragHandle` props to attach to whichever element should act as the
 * grab handle.
 */
export function SortableList<T extends { id: number }>({
    items,
    onReorder,
    renderItem,
    disabled,
    className,
    layout = 'list',
}: {
    items: T[];
    onReorder: (ids: number[]) => void;
    renderItem: (
        item: T,
        index: number,
        drag: { handle: DragHandle; isDragging: boolean },
    ) => ReactNode;
    disabled?: boolean;
    className?: string;
    /** 'list' for a vertically stacked list, 'grid' for wrapping tiles. */
    layout?: 'list' | 'grid';
}) {
    const strategy: SortingStrategy =
        layout === 'grid' ? rectSortingStrategy : verticalListSortingStrategy;

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 4 },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
    );

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        if (!over || active.id === over.id) {
            return;
        }

        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1) {
            return;
        }

        onReorder(arrayMove(items, oldIndex, newIndex).map((item) => item.id));
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items.map((item) => item.id)}
                strategy={strategy}
                disabled={disabled}
            >
                <div className={className}>
                    {items.map((item, index) => (
                        <SortableItem
                            key={item.id}
                            id={item.id}
                            disabled={disabled}
                        >
                            {({ setNodeRef, style, ...drag }) => (
                                <div ref={setNodeRef} style={style}>
                                    {renderItem(item, index, drag)}
                                </div>
                            )}
                        </SortableItem>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );
}

function SortableItem({
    id,
    disabled,
    children,
}: {
    id: number;
    disabled?: boolean;
    children: (args: {
        setNodeRef: (node: HTMLElement | null) => void;
        style: CSSProperties;
        handle: DragHandle;
        isDragging: boolean;
    }) => ReactNode;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        setActivatorNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id, disabled });

    const style: CSSProperties = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
    };

    return children({
        setNodeRef,
        style,
        isDragging,
        handle: { ref: setActivatorNodeRef, attributes, listeners },
    });
}
