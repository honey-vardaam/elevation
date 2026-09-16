import { type PointerEvent as ReactPointerEvent, useRef } from 'react';
import { Move, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;

function clamp(value: number, min: number, max: number): number {
    return Math.min(max, Math.max(min, value));
}

/**
 * Reposition + zoom a cover image within its frame, the way most photo/cover
 * editors do - no cropping happens server-side, this just stores where the
 * image should be anchored (object-position) and how far zoomed in it is
 * (a CSS scale on top), for banner-display.tsx to render consistently.
 */
export function BannerAdjuster({
    imageUrl,
    focalX,
    focalY,
    zoom,
    onChange,
}: {
    imageUrl: string;
    focalX: number;
    focalY: number;
    zoom: number;
    onChange: (focalX: number, focalY: number, zoom: number) => void;
}) {
    const frameRef = useRef<HTMLDivElement>(null);
    const dragState = useRef<{
        startX: number;
        startY: number;
        startFocalX: number;
        startFocalY: number;
    } | null>(null);

    function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
        event.currentTarget.setPointerCapture(event.pointerId);
        dragState.current = {
            startX: event.clientX,
            startY: event.clientY,
            startFocalX: focalX,
            startFocalY: focalY,
        };
    }

    function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
        const drag = dragState.current;
        const frame = frameRef.current;
        if (!drag || !frame) {
            return;
        }

        const rect = frame.getBoundingClientRect();
        const dx = event.clientX - drag.startX;
        const dy = event.clientY - drag.startY;

        onChange(
            clamp(drag.startFocalX - (dx / rect.width) * 100, 0, 100),
            clamp(drag.startFocalY - (dy / rect.height) * 100, 0, 100),
            zoom,
        );
    }

    function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
        event.currentTarget.releasePointerCapture(event.pointerId);
        dragState.current = null;
    }

    return (
        <div className="space-y-2">
            <div
                ref={frameRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                className="relative h-32 w-full cursor-move touch-none overflow-hidden rounded-lg border select-none"
            >
                <img
                    src={imageUrl}
                    alt=""
                    draggable={false}
                    className="h-full w-full object-cover"
                    style={{
                        objectPosition: `${focalX}% ${focalY}%`,
                        transform: `scale(${zoom})`,
                    }}
                />
                <div className="text-background/80 pointer-events-none absolute top-1.5 left-1.5 flex items-center gap-1 rounded-full bg-black/30 px-2 py-1 text-[10px]">
                    <Move className="size-3" />
                    Drag to reposition
                </div>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-xs">Zoom</span>
                <input
                    type="range"
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    step={0.05}
                    value={zoom}
                    onChange={(e) =>
                        onChange(focalX, focalY, Number(e.target.value))
                    }
                    className="accent-foreground h-1.5 flex-1"
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => onChange(50, 50, 1)}
                >
                    <RotateCcw className="size-3.5" />
                    <span className="sr-only">Reset position and zoom</span>
                </Button>
            </div>
        </div>
    );
}
