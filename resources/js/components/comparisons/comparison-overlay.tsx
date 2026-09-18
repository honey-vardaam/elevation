import {
    type PointerEvent as ReactPointerEvent,
    useEffect,
    useRef,
    useState,
} from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ComparisonFileSummary } from '@/types';
import type { Transform } from './use-zoom-pan';

/**
 * Both images stacked in the same spot, with a draggable vertical curtain:
 * everything left of it shows the left file, everything right shows the
 * right file - the classic before/after reveal. "Blink" instead rapidly
 * alternates the two full-frame, which is often faster for spotting a
 * small change than hunting along a curtain.
 */
export function ComparisonOverlay({
    leftFile,
    rightFile,
    transform,
    blinking,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUpMoved,
    onNaturalSize,
}: {
    leftFile: ComparisonFileSummary;
    rightFile: ComparisonFileSummary;
    transform: Transform;
    blinking: boolean;
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerMove: (e: ReactPointerEvent) => void;
    onPointerUpMoved: () => boolean;
    onNaturalSize: (size: { width: number; height: number }) => void;
}) {
    const [curtain, setCurtain] = useState(50);
    const [blinkShowLeft, setBlinkShowLeft] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const draggingCurtain = useRef(false);

    useEffect(() => {
        if (!blinking) {
            setBlinkShowLeft(true);
            return;
        }

        const interval = setInterval(() => setBlinkShowLeft((v) => !v), 650);
        return () => clearInterval(interval);
    }, [blinking]);

    function moveCurtain(clientX: number) {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const percent = ((clientX - rect.left) / rect.width) * 100;
        setCurtain(Math.min(100, Math.max(0, percent)));
    }

    function handleCurtainPointerDown(event: ReactPointerEvent) {
        event.stopPropagation();
        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        draggingCurtain.current = true;
    }

    function handlePointerMove(event: ReactPointerEvent) {
        if (draggingCurtain.current) {
            moveCurtain(event.clientX);
            return;
        }
        onPointerMove(event);
    }

    function handlePointerUp() {
        if (draggingCurtain.current) {
            draggingCurtain.current = false;
            return;
        }
        onPointerUpMoved();
    }

    return (
        <div
            ref={containerRef}
            className="relative h-full w-full overflow-hidden bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(var(--color-muted)/60_0%_25%,transparent_0%_50%)]"
            style={{ cursor: 'grab' }}
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
        >
            <div
                className="absolute top-0 left-0"
                style={{
                    transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                    transformOrigin: '0 0',
                }}
            >
                {/* Left file: always the base layer */}
                <img
                    src={leftFile.view_url}
                    alt=""
                    draggable={false}
                    className="pointer-events-none block max-w-none select-none"
                    onLoad={(e) =>
                        onNaturalSize({
                            width: e.currentTarget.naturalWidth,
                            height: e.currentTarget.naturalHeight,
                        })
                    }
                />
                {/* Right file: clipped to the curtain, or fully hidden/shown while blinking */}
                <div
                    className="pointer-events-none absolute top-0 left-0 h-full w-full overflow-hidden"
                    style={{
                        clipPath: blinking
                            ? undefined
                            : `inset(0 ${100 - curtain}% 0 0)`,
                        opacity: blinking ? (blinkShowLeft ? 0 : 1) : 1,
                        transition: blinking ? 'opacity 150ms ease' : undefined,
                    }}
                >
                    <img
                        src={rightFile.view_url}
                        alt=""
                        draggable={false}
                        className="pointer-events-none block max-w-none select-none"
                    />
                </div>
            </div>

            {!blinking && (
                <div
                    data-no-pan
                    onPointerDown={handleCurtainPointerDown}
                    className="absolute top-0 bottom-0 z-10 flex w-6 -translate-x-1/2 cursor-ew-resize items-center justify-center"
                    style={{ left: `${curtain}%` }}
                >
                    <div className="bg-primary absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 shadow" />
                    <div className="bg-primary text-primary-foreground relative flex size-7 items-center justify-center rounded-full shadow-md">
                        <GripVertical className="size-4" />
                    </div>
                </div>
            )}

            <div
                className={cn(
                    'pointer-events-none absolute top-3 left-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white transition-opacity',
                    blinking && !blinkShowLeft && 'opacity-0',
                )}
            >
                {leftFile.name}
            </div>
            <div
                className={cn(
                    'pointer-events-none absolute top-3 right-3 rounded-md bg-black/60 px-2 py-0.5 text-xs font-medium text-white transition-opacity',
                    blinking && blinkShowLeft && 'opacity-0',
                    !blinking && curtain < 15 && 'opacity-0',
                )}
            >
                {rightFile.name}
            </div>
        </div>
    );
}
