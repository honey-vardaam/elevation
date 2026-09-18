import {
    type PointerEvent as ReactPointerEvent,
    type RefObject,
    useRef,
    useState,
} from 'react';

export type Transform = { scale: number; x: number; y: number };

const MIN_SCALE = 0.2;
const MAX_SCALE = 8;
const IDENTITY: Transform = { scale: 1, x: 0, y: 0 };

function clampScale(scale: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/**
 * One shared pan/zoom transform, applied identically wherever it's
 * rendered - side-by-side panes stay in lockstep because they all read the
 * same state, even though each is a separate DOM element at a different
 * screen position. Wheel/drag handlers read their bounding rect from
 * `event.currentTarget` at call time instead of a fixed ref, so "zoom
 * toward the cursor" is correct no matter which pane the event fired on.
 */
export function useZoomPan(centerRef?: RefObject<HTMLElement | null>) {
    const [transform, setTransform] = useState<Transform>(IDENTITY);
    const drag = useRef<{
        startX: number;
        startY: number;
        origin: Transform;
        moved: boolean;
    } | null>(null);

    function zoomAt(
        rect: DOMRect,
        clientX: number,
        clientY: number,
        factor: number,
    ) {
        setTransform((current) => {
            const nextScale = clampScale(current.scale * factor);
            const ratio = nextScale / current.scale;
            const originX = clientX - rect.left;
            const originY = clientY - rect.top;

            return {
                scale: nextScale,
                x: originX - (originX - current.x) * ratio,
                y: originY - (originY - current.y) * ratio,
            };
        });
    }

    function handleWheel(event: React.WheelEvent) {
        event.preventDefault();
        const rect = event.currentTarget.getBoundingClientRect();
        const factor = Math.exp(-event.deltaY * 0.0018);
        zoomAt(rect, event.clientX, event.clientY, factor);
    }

    function handlePointerDown(event: ReactPointerEvent) {
        // Ignore drags that start on interactive chrome (pin markers,
        // buttons) so clicking them doesn't also start a pan.
        if ((event.target as HTMLElement).closest('[data-no-pan]')) {
            return;
        }

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        drag.current = {
            startX: event.clientX,
            startY: event.clientY,
            origin: transform,
            moved: false,
        };
    }

    function handlePointerMove(event: ReactPointerEvent) {
        if (!drag.current) {
            return;
        }

        const dx = event.clientX - drag.current.startX;
        const dy = event.clientY - drag.current.startY;

        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
            drag.current.moved = true;
        }

        if (drag.current.moved) {
            setTransform({
                scale: drag.current.origin.scale,
                x: drag.current.origin.x + dx,
                y: drag.current.origin.y + dy,
            });
        }
    }

    /** Returns whether the pointer actually dragged, so a click handler on the same element can tell a pan apart from a tap-to-pin. */
    function handlePointerUp(): boolean {
        const moved = drag.current?.moved ?? false;
        drag.current = null;
        return moved;
    }

    function zoomButton(factor: number) {
        const rect = centerRef?.current?.getBoundingClientRect();
        const cx = rect ? rect.left + rect.width / 2 : 0;
        const cy = rect ? rect.top + rect.height / 2 : 0;
        setTransform((current) => {
            const nextScale = clampScale(current.scale * factor);
            if (!rect) {
                return { ...current, scale: nextScale };
            }
            const ratio = nextScale / current.scale;
            const originX = cx - rect.left;
            const originY = cy - rect.top;
            return {
                scale: nextScale,
                x: originX - (originX - current.x) * ratio,
                y: originY - (originY - current.y) * ratio,
            };
        });
    }

    function zoomIn() {
        zoomButton(1.3);
    }

    function zoomOut() {
        zoomButton(1 / 1.3);
    }

    function reset() {
        setTransform(IDENTITY);
    }

    return {
        transform,
        setTransform,
        zoomIn,
        zoomOut,
        reset,
        handleWheel,
        handlePointerDown,
        handlePointerMove,
        handlePointerUp,
    };
}
