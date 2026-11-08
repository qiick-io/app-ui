import { useEffect, useState } from 'react';

/**
 * Keyboard access for a scroll container (WCAG 2.1.1, axe
 * `scrollable-region-focusable`): while its content overflows, the container
 * takes `tabIndex={0}` so arrow keys and Page Up / Down scroll it; when nothing
 * overflows it stays out of the tab order.
 *
 * @returns {[(element: TElement | null) => void, 0 | undefined]} The callback ref and the `tabIndex` for the scroll container.
 */
export function useScrollRegion<TElement extends HTMLElement>(): [
    (element: TElement | null) => void,
    0 | undefined,
] {
    const [element, setElement] = useState<TElement | null>(null);
    const [isScrollable, setIsScrollable] = useState(false);

    useEffect(() => {
        if (!element) {
            return;
        }

        const update = (): void => {
            setIsScrollable(
                element.scrollHeight > element.clientHeight + 1 ||
                    element.scrollWidth > element.clientWidth + 1,
            );
        };
        const resizeObserver = new ResizeObserver(update);
        const observeChildren = (): void => {
            resizeObserver.disconnect();
            resizeObserver.observe(element);

            for (const child of Array.from(element.children)) {
                resizeObserver.observe(child);
            }

            update();
        };
        const mutationObserver = new MutationObserver(observeChildren);

        observeChildren();
        mutationObserver.observe(element, { childList: true });

        return () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
        };
    }, [element]);

    return [setElement, isScrollable ? 0 : undefined];
}
