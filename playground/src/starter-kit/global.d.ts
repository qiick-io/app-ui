// The shared Inertia prop the registry reads, as declared by the starter kit.
declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}

export {};
