/**
 * Run after keyboard navigation. The caller supplies rectangular opaque
 * overlays from the current flow. Transparency and other layers need review.
 * Source: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
 */
(opaqueOverlaySelector) => {
    const result = {
        rule: 'focus-not-obscured',
        violations: [],
        needsReview: [],
    };
    const focused = document.activeElement;

    if (
        !focused ||
        focused === document.body ||
        focused === document.documentElement
    ) {
        result.violations.push({
            detail: 'The keyboard step did not focus a control.',
        });

        return result;
    }

    const focusedBounds = focused.getBoundingClientRect();
    const left = Math.max(0, focusedBounds.left);
    const top = Math.max(0, focusedBounds.top);
    const right = Math.min(window.innerWidth, focusedBounds.right);
    const bottom = Math.min(window.innerHeight, focusedBounds.bottom);
    if (right <= left || bottom <= top) {
        result.needsReview.push({
            detail: 'The focused control has no area in the viewport.',
        });

        return result;
    }

    const hit = document.elementFromPoint(
        (left + right) / 2,
        (top + bottom) / 2,
    );
    const overlay =
        opaqueOverlaySelector && hit?.closest(opaqueOverlaySelector);
    if (focused.contains(hit)) {
        return result;
    }

    if (overlay && !overlay.contains(focused)) {
        const bounds = overlay.getBoundingClientRect();
        if (
            bounds.left <= left &&
            bounds.top <= top &&
            bounds.right >= right &&
            bounds.bottom >= bottom
        ) {
            result.violations.push({
                detail: 'An opaque overlay covers the focused control.',
            });

            return result;
        }
    }

    result.needsReview.push({
        detail: 'Another layer overlaps the centre of the focused control. Check whether any part is visible.',
    });

    return result;
};
