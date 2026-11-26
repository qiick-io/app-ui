import {
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import i18n from 'i18next';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { SecretOnceDialog } from '@/components/secrets/secret-once-dialog';
import en from '../../../locales/en.json';

const ISSUED_SECRET = 'whsec_test_not_a_real_secret';

/** The app side: holds the secret from the response that issued it and drops it on acknowledge. */
function SecretHarness() {
    const [secret, setSecret] = useState<string | null>(null);

    return (
        <>
            <button
                type="button"
                aria-label="Issue"
                onClick={() => setSecret(ISSUED_SECRET)}
            />
            <SecretOnceDialog
                secret={secret}
                onAcknowledge={() => setSecret(null)}
                title="Signing secret"
                announcement="Signing secret issued"
            />
        </>
    );
}

function issueSecret(): void {
    fireEvent.click(screen.getByRole('button', { name: 'Issue' }));
}

function copyButton(): HTMLElement {
    return screen.getByRole('button', {
        name: new RegExp(`${en.secretOnce.copy}|${en.secretOnce.copied}`),
    });
}

function doneButton(): HTMLElement {
    return screen.getByRole('button', { name: en.secretOnce.done });
}

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: en } },
        interpolation: { escapeValue: false },
    });
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('SecretOnceDialog', () => {
    it('forgets the acknowledgement and the copy once the app drops the secret', async () => {
        vi.stubGlobal('navigator', {
            clipboard: { writeText: vi.fn(async () => {}) },
        });
        render(<SecretHarness />);

        issueSecret();
        fireEvent.click(copyButton());
        await waitFor(() =>
            expect(copyButton().getAttribute('aria-label')).toBe(
                en.secretOnce.copied,
            ),
        );
        fireEvent.click(screen.getByRole('checkbox'));
        fireEvent.click(doneButton());
        await waitFor(() =>
            expect(screen.queryByRole('alertdialog')).toBeNull(),
        );

        // The same value shown again (a re-render, a second issue) must not open already confirmed.
        issueSecret();

        expect(doneButton()).toHaveProperty('disabled', true);
        expect(screen.getByRole('checkbox').getAttribute('aria-checked')).toBe(
            'false',
        );
        expect(copyButton().getAttribute('aria-label')).toBe(
            en.secretOnce.copy,
        );
    });

    it('copies from the secret field itself when the Clipboard API is missing', async () => {
        vi.stubGlobal('navigator', {});
        let copiedSelection: string | null = null;
        let wasTextareaAppended = true;
        const execCommand = vi.fn(() => {
            const activeField = document.activeElement as HTMLInputElement;
            copiedSelection = activeField.value.slice(
                activeField.selectionStart ?? 0,
                activeField.selectionEnd ?? 0,
            );
            wasTextareaAppended = document.querySelector('textarea') !== null;

            return true;
        });
        Object.defineProperty(document, 'execCommand', {
            configurable: true,
            value: execCommand,
        });
        render(<SecretHarness />);

        issueSecret();
        fireEvent.click(copyButton());

        await waitFor(() => expect(execCommand).toHaveBeenCalledWith('copy'));
        expect(copiedSelection).toBe(ISSUED_SECRET);
        expect(wasTextareaAppended).toBe(false);
        expect(document.activeElement).toBe(
            screen.getByDisplayValue(ISSUED_SECRET),
        );
    });
});
