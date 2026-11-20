import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/** Component tests run against the same `@/` paths the registry items ship with. */
export default defineConfig({
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./registry/src', import.meta.url)),
        },
    },
    test: {
        environment: 'jsdom',
        include: ['registry/src/**/*.test.{ts,tsx}'],
    },
});
