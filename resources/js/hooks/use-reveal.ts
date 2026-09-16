import { useEffect, useRef, useState } from 'react';

/**
 * Reveals an element (fade/slide via the caller's own classes) the first
 * time it scrolls into view. Starts already-visible when the visitor
 * prefers reduced motion, so nothing depends on a transition firing.
 */
export function useReveal<T extends HTMLElement = HTMLDivElement>(
    threshold = 0.15,
) {
    const ref = useRef<T>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold },
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, [threshold]);

    return { ref, visible };
}
