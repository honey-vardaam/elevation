import { useEffect, useRef } from 'react';

/**
 * Scroll-linked parallax: `layerRef` translates vertically at `speed`
 * (0-1) of `containerRef`'s scroll delta, so it appears to move slower
 * than the foreground as the page scrolls. Reads position from the
 * container (never itself transformed) rather than the layer, so the
 * transform doesn't feed back into the next frame's measurement.
 * No-ops when the visitor prefers reduced motion.
 */
export function useParallax<
    C extends HTMLElement = HTMLDivElement,
    L extends HTMLElement = HTMLDivElement,
>(speed = 0.2) {
    const containerRef = useRef<C>(null);
    const layerRef = useRef<L>(null);

    useEffect(() => {
        const container = containerRef.current;
        const layer = layerRef.current;
        if (!container || !layer) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        let frame = 0;

        function update() {
            if (!container || !layer) {
                return;
            }
            const offset = container.getBoundingClientRect().top * speed;
            layer.style.transform = `translate3d(0, ${offset}px, 0)`;
        }

        function onScroll() {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(update);
        }

        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [speed]);

    return { containerRef, layerRef };
}
