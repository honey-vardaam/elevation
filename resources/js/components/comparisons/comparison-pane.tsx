import {
    type PointerEvent as ReactPointerEvent,
    type ReactNode,
    type RefObject,
    useEffect,
    useRef,
} from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { fileIconFor, formatBytes } from '@/lib/file-display';
import { cn } from '@/lib/utils';
import type { ComparisonFileSummary } from '@/types';
import type { Transform } from './use-zoom-pan';

export type Pin = {
    id: number;
    x: number;
    y: number;
    number: number;
    resolved: boolean;
};

/** Renders the actual file content at its natural size - the thing pan/zoom and pin coordinates are relative to. */
function FileSurface({
    file,
    surfaceRef,
    onNaturalSize,
}: {
    file: ComparisonFileSummary;
    surfaceRef: RefObject<HTMLDivElement | null>;
    onNaturalSize: (size: { width: number; height: number }) => void;
}) {
    if (file.is_image) {
        return (
            <div
                ref={surfaceRef}
                className="relative inline-block leading-none"
            >
                <img
                    src={file.view_url}
                    alt=""
                    draggable={false}
                    className="pointer-events-none block max-w-none select-none"
                    onLoad={(e) => {
                        const img = e.currentTarget;
                        onNaturalSize({
                            width: img.naturalWidth,
                            height: img.naturalHeight,
                        });
                    }}
                />
            </div>
        );
    }

    if (file.is_pdf) {
        return (
            <div
                ref={surfaceRef}
                className="relative inline-block leading-none"
            >
                <iframe
                    src={file.view_url}
                    title={file.name}
                    className="pointer-events-none block border-0 bg-white"
                    style={{ width: 850, height: 1100 }}
                    onLoad={() => onNaturalSize({ width: 850, height: 1100 })}
                />
            </div>
        );
    }

    const Icon = fileIconFor(file.mime_type);

    // No load event ever fires for a static placeholder, so resolve the
    // pane's loading state immediately instead of spinning forever.
    useEffect(() => {
        onNaturalSize({ width: 320, height: 200 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [file.id]);

    return (
        <div
            ref={surfaceRef}
            className="bg-card text-muted-foreground flex flex-col items-center justify-center gap-2 rounded-lg border p-10"
            style={{ width: 320, height: 200 }}
        >
            <Icon className="size-10" strokeWidth={1.25} />
            <p className="max-w-48 text-center text-xs">
                No inline preview for this file type.
            </p>
            <a
                href={file.download_url}
                data-no-pan
                className="text-primary text-xs font-medium hover:underline"
            >
                Download to compare
            </a>
        </div>
    );
}

function PinMarker({
    pin,
    active,
    onClick,
}: {
    pin: Pin;
    active: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            data-no-pan
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            className={cn(
                'absolute flex size-6 -translate-x-1/2 -translate-y-full items-center justify-center rounded-full rounded-bl-none border-2 border-white text-[11px] font-bold text-white shadow-md transition-transform hover:scale-110',
                pin.resolved ? 'bg-muted-foreground' : 'bg-primary',
                active && 'ring-primary ring-2 ring-offset-2',
            )}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
            {pin.number}
        </button>
    );
}

export function EmptyPanePicker({
    label,
    onPick,
}: {
    label: string;
    onPick: () => void;
}) {
    return (
        <div className="flex h-full items-center justify-center p-6">
            <Button variant="outline" onClick={onPick}>
                <Plus className="size-4" />
                {label}
            </Button>
        </div>
    );
}

export function ComparisonPane({
    file,
    transform,
    pins,
    activePinId,
    placingPin,
    onPlacePin,
    onPinClick,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerUpMoved,
    onNaturalSize,
    header,
    emptyLabel,
    onPickFile,
    loading = false,
}: {
    file: ComparisonFileSummary | null;
    transform: Transform;
    pins: Pin[];
    activePinId: number | null;
    placingPin: boolean;
    onPlacePin: (x: number, y: number) => void;
    onPinClick: (id: number) => void;
    onWheel: (e: React.WheelEvent) => void;
    onPointerDown: (e: ReactPointerEvent) => void;
    onPointerMove: (e: ReactPointerEvent) => void;
    onPointerUpMoved: () => boolean;
    onNaturalSize: (size: { width: number; height: number }) => void;
    header: ReactNode;
    emptyLabel: string;
    onPickFile: () => void;
    loading?: boolean;
}) {
    const surfaceRef = useRef<HTMLDivElement>(null);

    function handlePointerUp(event: ReactPointerEvent) {
        const moved = onPointerUpMoved();

        if (moved || !placingPin || !file || !surfaceRef.current) {
            return;
        }

        const target = event.target as HTMLElement;
        if (target.closest('[data-no-pan]')) {
            return;
        }

        const rect = surfaceRef.current.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
            return;
        }

        const x = ((event.clientX - rect.left) / rect.width) * 100;
        const y = ((event.clientY - rect.top) / rect.height) * 100;

        if (x < 0 || x > 100 || y < 0 || y > 100) {
            return;
        }

        onPlacePin(x, y);
    }

    return (
        <div className="flex h-full min-w-0 flex-1 flex-col">
            {header}
            <div
                className={cn(
                    'relative min-h-0 flex-1 overflow-hidden',
                    'bg-[repeating-conic-gradient(var(--color-muted)_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(var(--color-muted)/60_0%_25%,transparent_0%_50%)]',
                )}
                style={{
                    cursor: !file
                        ? 'default'
                        : placingPin
                          ? 'crosshair'
                          : 'grab',
                }}
                onWheel={file ? onWheel : undefined}
                onPointerDown={file ? onPointerDown : undefined}
                onPointerMove={file ? onPointerMove : undefined}
                onPointerUp={file ? handlePointerUp : undefined}
            >
                {!file ? (
                    <EmptyPanePicker label={emptyLabel} onPick={onPickFile} />
                ) : (
                    <>
                        {loading && (
                            <div className="bg-background/60 absolute inset-0 z-10 flex items-center justify-center">
                                <Spinner />
                            </div>
                        )}
                        <div
                            className="absolute top-0 left-0"
                            style={{
                                transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
                                transformOrigin: '0 0',
                            }}
                        >
                            <FileSurface
                                file={file}
                                surfaceRef={surfaceRef}
                                onNaturalSize={onNaturalSize}
                            />
                            {pins.map((pin) => (
                                <PinMarker
                                    key={pin.id}
                                    pin={pin}
                                    active={pin.id === activePinId}
                                    onClick={() => onPinClick(pin.id)}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export function FileMeta({ file }: { file: ComparisonFileSummary }) {
    return (
        <p className="text-muted-foreground truncate text-xs">
            {formatBytes(file.size)} · uploaded by {file.uploaded_by.name}
        </p>
    );
}
