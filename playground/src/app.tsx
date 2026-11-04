import type { ComponentType } from 'react';
import registry from '../../registry/registry.json';

const demoModules = import.meta.glob<{ default: ComponentType }>(
    './demos/*.tsx',
    { eager: true },
);

/**
 * Every registry item, rendered side by side in light and dark mode.
 * Demos live in `demos/{item name}.tsx` (`npm run registry:check` fails when one is missing).
 */
export function App() {
    return (
        <main className="flex flex-col gap-10 p-6">
            <header>
                <h1 className="text-xl font-semibold">qiick app UI</h1>
                <p className="text-muted-foreground text-sm">
                    {registry.items.length} registry items, light and dark.
                </p>
            </header>
            {registry.items.map((item) => {
                const Demo = demoModules[`./demos/${item.name}.tsx`]?.default;

                return (
                    <section
                        key={item.name}
                        id={item.name}
                        className="flex flex-col gap-3"
                    >
                        <div>
                            <h2 className="font-mono text-sm font-semibold">
                                {item.name}
                            </h2>
                            <p className="text-muted-foreground text-sm">
                                {item.description}
                            </p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {['light', 'dark'].map((mode) => (
                                <div
                                    key={mode}
                                    className={`${mode} bg-background text-foreground rounded-lg border p-6`}
                                >
                                    {Demo ? <Demo /> : <p>No demo.</p>}
                                </div>
                            ))}
                        </div>
                    </section>
                );
            })}
        </main>
    );
}
