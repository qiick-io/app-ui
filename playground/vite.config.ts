import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import type { ViteDevServer } from 'vite';

const fromHere = (path: string) =>
    fileURLToPath(new URL(path, import.meta.url));

/** Serve the RFC 9116 charset on Vite's local development and preview servers. */
function configureSecurityTxtCharset({
    middlewares,
}: Pick<ViteDevServer, 'middlewares'>) {
    middlewares.use((request, response, next) => {
        if (request.url?.split('?', 1)[0] === '/.well-known/security.txt') {
            response.setHeader('Content-Type', 'text/plain; charset=utf-8');
        }

        next();
    });
}

export default defineConfig({
    plugins: [
        react(),
        tailwindcss(),
        {
            name: 'security-txt-charset',
            configureServer: configureSecurityTxtCharset,
            configurePreviewServer: configureSecurityTxtCharset,
        },
    ],
    resolve: {
        alias: [
            // No Inertia server here: usePage, Link and router are stubbed.
            {
                find: '@inertiajs/react',
                replacement: fromHere('src/starter-kit/inertia.tsx'),
            },
            // Same `@/` alias as the apps, so registry sources import unchanged.
            { find: '@', replacement: fromHere('../registry/src') },
        ],
    },
});
