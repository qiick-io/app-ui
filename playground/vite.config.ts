import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const fromHere = (path: string) =>
    fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    plugins: [react(), tailwindcss()],
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
