import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { InfoHint } from '@/components/info-hint';
import { CardTableScroll } from '@/components/layout/card-table-scroll';
import enLocale from '../../locales/en.json';

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: enLocale } },
        interpolation: { escapeValue: false },
    });
});

afterEach(cleanup);

const HINT_LABEL = 'About Projects';
const HINT_TEXT = 'A project can move.';
const COLUMN = 'Check';

it('opens the explanation from a named icon button, in a named popover', () => {
    render(<InfoHint label={HINT_LABEL}>{HINT_TEXT}</InfoHint>);

    fireEvent.click(screen.getByRole('button', { name: 'About Projects' }));

    expect(screen.getByRole('dialog', { name: 'About Projects' })).toBeTruthy();
    expect(screen.getByRole('dialog').textContent).toContain(
        'A project can move.',
    );
});

it('scrolls the table in its own box, the header clear of focused rows', () => {
    render(
        <CardTableScroll className="max-h-80">
            <table>
                <thead>
                    <tr>
                        <th>{COLUMN}</th>
                    </tr>
                </thead>
            </table>
        </CardTableScroll>,
    );

    const box = screen.getByRole('table').parentElement;

    expect(box?.getAttribute('data-slot')).toBe('card-table-scroll');
    expect(box?.className).toContain('max-h-80');
    expect(box?.className).toContain('scroll-pt-10');
    expect(box?.className).toContain('[&_thead]:sticky');
});
