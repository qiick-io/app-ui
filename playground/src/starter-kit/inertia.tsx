/**
 * Playground stand-in for `@inertiajs/react` (aliased in vite.config.ts):
 * there is no Inertia server, so pages, links and visits are inert.
 */
import type { AnchorHTMLAttributes } from 'react';

export function usePage() {
    return { props: { sidebarOpen: true } };
}

/* eslint-disable @typescript-eslint/no-unused-vars -- Inertia-only props are dropped, not passed to the DOM. */
export function Link({
    href,
    children,
    prefetch,
    method,
    as,
    ...props
}: Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> & {
    href: string | { url: string };
    prefetch?: boolean;
    method?: string;
    as?: string;
}) {
    return (
        <a
            {...props}
            href={typeof href === 'string' ? href : href.url}
            onClick={(event) => {
                event.preventDefault();
                props.onClick?.(event);
            }}
        >
            {children}
        </a>
    );
}
/* eslint-enable @typescript-eslint/no-unused-vars */

export const router = {
    visit: (url: string) => console.info('router.visit', url),
    get: (url: string) => console.info('router.get', url),
};
