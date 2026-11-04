/**
 * Playground stand-in for `@inertiajs/react` (aliased in vite.config.ts):
 * there is no Inertia server, so pages, links and visits are inert.
 */
import type { AnchorHTMLAttributes } from 'react';

export function usePage() {
    return { props: { sidebarOpen: true } };
}

export function Link({
    href,
    children,
    ...props
}: AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
}) {
    return (
        <a href={href} onClick={(event) => event.preventDefault()} {...props}>
            {children}
        </a>
    );
}

export const router = {
    visit: (url: string) => console.info('router.visit', url),
    get: (url: string) => console.info('router.get', url),
};
