import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import bluePreset from '../../packages/app-theme/src/presets/blue.css?inline';
import registry from '../../registry/registry.json';
import { ThemeTokens } from './theme-tokens';

const PRESETS = { teal: '', blue: bluePreset } as const;

type PresetName = keyof typeof PRESETS;

const demoModules = import.meta.glob<{ default: ComponentType }>(
    './demos/*.tsx',
    { eager: true },
);

/**
 * Light and dark panels side by side.
 */
function LightAndDark({ children }: { children: ReactNode }) {
    return (
        <div className="grid gap-4 lg:grid-cols-2">
            {['light', 'dark'].map((mode) => (
                <div
                    key={mode}
                    className={`${mode} rounded-lg border bg-background p-6 text-foreground`}
                >
                    {children}
                </div>
            ))}
        </div>
    );
}

/**
 * The theme tokens and every registry item, rendered side by side in light and
 * dark mode, with a brand preset and a high-contrast switch.
 * Demos live in `demos/{item name}.tsx` (`npm run registry:check` fails when one is missing).
 */
export function App() {
    const [preset, setPreset] = useState<PresetName>('teal');
    const [isHighContrast, setIsHighContrast] = useState(false);

    useEffect(() => {
        document.documentElement.classList.toggle(
            'high-contrast',
            isHighContrast,
        );
    }, [isHighContrast]);

    return (
        <main className="flex flex-col gap-10 p-6">
            <style>{PRESETS[preset]}</style>
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">qiick app UI</h1>
                    <p className="text-sm text-muted-foreground">
                        {registry.items.length} registry items, light and dark.
                    </p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <label className="flex items-center gap-2">
                        Preset
                        <select
                            className="h-control rounded-md border border-input bg-background px-2"
                            value={preset}
                            onChange={(event) =>
                                setPreset(event.target.value as PresetName)
                            }
                        >
                            {Object.keys(PRESETS).map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={isHighContrast}
                            onChange={(event) =>
                                setIsHighContrast(event.target.checked)
                            }
                        />
                        High contrast
                    </label>
                </div>
            </header>
            <section id="theme" className="flex flex-col gap-3">
                <h2 className="font-mono text-sm font-semibold">theme</h2>
                <LightAndDark>
                    <ThemeTokens />
                </LightAndDark>
            </section>
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
                            <p className="text-sm text-muted-foreground">
                                {item.description}
                            </p>
                        </div>
                        <LightAndDark>
                            {Demo ? <Demo /> : <p>No demo.</p>}
                        </LightAndDark>
                    </section>
                );
            })}
        </main>
    );
}
