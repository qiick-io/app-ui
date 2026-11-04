import { useEffect, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import bluePreset from '../../packages/app-theme/src/presets/blue.css?inline';
import themeSource from '../../packages/app-theme/src/theme.css?raw';
import registry from '../../registry/registry.json';
import { AssistantScreen } from './screens/assistant';
import { ChatScreen } from './screens/chat';
import type { ScreenName } from './screens/demo-shell';
import { SettingsScreen } from './screens/settings';
import { UsersScreen } from './screens/users';
import { ThemeTokens } from './theme-tokens';

const PRESETS = { teal: '', blue: bluePreset } as const;

/**
 * Tailwind resolves `--color-x: var(--x)` once, on `:root`. The apps put
 * `.dark` on `<html>`, but the catalogue nests light and dark panels, so they
 * resolve the mappings again.
 */
const NESTED_MODE_CSS = `.light, .dark { ${[
    ...themeSource.matchAll(/(--color-[a-z0-9-]+):\s*(var\(--[a-z0-9-]+\));/g),
]
    .map(([, name, value]) => `${name}: ${value};`)
    .join(' ')} }`;

type PresetName = keyof typeof PRESETS;

const SCREENS: Record<ScreenName, ComponentType> = {
    users: UsersScreen,
    settings: SettingsScreen,
    assistant: AssistantScreen,
    chat: ChatScreen,
};

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
 * `#/{screen}[/dark][/blue][/high-contrast]`: a full-page screen built from the
 * registry (for side-by-side checks against externa-core); anything else: the
 * component catalogue.
 */
function useRoute() {
    const [hash, setHash] = useState(window.location.hash);

    useEffect(() => {
        const onHashChange = () => setHash(window.location.hash);
        window.addEventListener('hashchange', onHashChange);

        return () => window.removeEventListener('hashchange', onHashChange);
    }, []);

    const parts = hash.replace(/^#\/?/, '').split('/');

    return {
        screen: parts[0] in SCREENS ? (parts[0] as ScreenName) : null,
        isDark: parts.includes('dark'),
        preset: (parts.includes('blue') ? 'blue' : 'teal') as PresetName,
        isHighContrast: parts.includes('high-contrast'),
    };
}

export function App() {
    const route = useRoute();

    useEffect(() => {
        document.documentElement.classList.toggle(
            'dark',
            route.screen !== null && route.isDark,
        );
    }, [route.screen, route.isDark]);

    if (route.screen === null) {
        return <Catalogue />;
    }

    const Screen = SCREENS[route.screen];

    return (
        <>
            <style>{PRESETS[route.preset]}</style>
            <HighContrastClass isHighContrast={route.isHighContrast} />
            <Screen />
        </>
    );
}

function HighContrastClass({ isHighContrast }: { isHighContrast: boolean }) {
    useEffect(() => {
        document.documentElement.classList.toggle(
            'high-contrast',
            isHighContrast,
        );
    }, [isHighContrast]);

    return null;
}

/**
 * The theme tokens and every registry item, rendered side by side in light and
 * dark mode, with a brand preset and a high-contrast switch.
 * Demos live in `demos/{item name}.tsx` (`npm run registry:check` fails when one is missing).
 */
function Catalogue() {
    const [preset, setPreset] = useState<PresetName>('teal');
    const [isHighContrast, setIsHighContrast] = useState(false);

    return (
        <main className="flex flex-col gap-10 p-6">
            <style>{PRESETS[preset] + NESTED_MODE_CSS}</style>
            <HighContrastClass isHighContrast={isHighContrast} />
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">qiick app UI</h1>
                    <p className="text-sm text-muted-foreground">
                        {registry.items.length} registry items, light and dark.
                        Screens:{' '}
                        {Object.keys(SCREENS).map((screen) => (
                            <span key={screen}>
                                <a
                                    className="text-primary underline"
                                    href={`#/${screen}`}
                                >
                                    {screen}
                                </a>{' '}
                                (
                                <a
                                    className="text-primary underline"
                                    href={`#/${screen}/dark`}
                                >
                                    dark
                                </a>
                                ){' '}
                            </span>
                        ))}
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
