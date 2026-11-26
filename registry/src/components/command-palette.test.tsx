import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { CommandPalette } from '@/components/command-palette';
import { ShortcutsProvider } from '@/components/keyboard-shortcuts';
import itLocale from '../../locales/it.json';

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'it',
        resources: { it: { translation: itLocale } },
        interpolation: { escapeValue: false },
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it('keeps a localized accessible search name while typing', () => {
    // cmdk sizes its list using an observer that jsdom does not implement.
    vi.stubGlobal(
        'ResizeObserver',
        class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        },
    );
    render(
        <ShortcutsProvider>
            <CommandPalette
                open
                onOpenChange={vi.fn()}
                groups={[]}
                onNavigate={vi.fn()}
                recentStorageKey="test.palette.recent"
            />
        </ShortcutsProvider>,
    );

    const searchName = itLocale.commandPalette.placeholder;
    const search = screen.getByRole('combobox', { name: searchName });
    fireEvent.change(search, { target: { value: 'fattura' } });

    expect(screen.getByRole('combobox', { name: searchName })).toBe(search);
    expect((search as HTMLInputElement).value).toBe('fattura');
});
