import {
    act,
    cleanup,
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react';
import i18n from 'i18next';
import type { ComponentProps } from 'react';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { DatePicker } from '@/components/admin/date-picker';
import de from '../../../locales/de.json';
import en from '../../../locales/en.json';
import itLocale from '../../../locales/it.json';

type PickerFormProps = Partial<ComponentProps<typeof DatePicker>>;

/** Exercise both the controlled value and the plain form payload. */
function PickerForm({
    value: initialValue = null,
    onChange,
    ...props
}: PickerFormProps) {
    const [value, setValue] = useState(initialValue);

    return (
        <form aria-label="Example">
            <DatePicker
                label="Expiry"
                name="expiry"
                {...props}
                value={value}
                onChange={(next) => {
                    setValue(next);
                    onChange?.(next);
                }}
            />
        </form>
    );
}

function submittedValue(): FormDataEntryValue | null {
    const form = screen.getByRole<HTMLFormElement>('form', { name: 'Example' });

    return new FormData(form).get('expiry');
}

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        fallbackLng: 'en',
        resources: {
            en: { translation: en },
            de: { translation: de },
            it: { translation: itLocale },
        },
        interpolation: { escapeValue: false },
    });
});

afterEach(async () => {
    cleanup();
    vi.useRealTimers();
    await i18n.changeLanguage('en');
});

it('commits real four-digit Gregorian dates and clears to null', () => {
    const onChange = vi.fn();
    render(<PickerForm value="2024-02-29" onChange={onChange} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'Expiry',
    });
    const form = screen.getByRole<HTMLFormElement>('form');

    expect(input.value).toBe('02/29/2024');
    expect(submittedValue()).toBe('2024-02-29');

    for (const invalid of [
        '02/29/2023',
        '04/31/2026',
        '01/01/100000',
        '01/01/0000',
    ]) {
        fireEvent.change(input, { target: { value: invalid } });
        act(() => {
            expect(form.checkValidity()).toBe(false);
        });
        expect(screen.getByRole('alert').textContent).toContain(
            'four-digit year',
        );
        expect(onChange).not.toHaveBeenCalled();
        expect(submittedValue()).toBe('2024-02-29');
    }

    fireEvent.change(input, { target: { value: '01/02/0001' } });
    expect(submittedValue()).toBe('0001-01-02');
    expect(form.checkValidity()).toBe(true);

    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(submittedValue()).toBe('');
});

it('keeps typed wall time and enforces both inclusive minute bounds', () => {
    render(
        <PickerForm
            hasTime
            value="2026-03-08T09:30"
            timeZone="America/New_York"
            min="2026-03-08T08:30"
            max="2026-03-09T17:00"
        />,
    );
    const input = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'Expiry',
    });

    expect(input.value).toBe('03/08/2026 09:30');
    expect(screen.getByText(/America\/New_York/)).toBeTruthy();

    fireEvent.change(input, { target: { value: '03/08/2026 08:29' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toContain('on or after');

    fireEvent.change(input, { target: { value: '3/8/2026  8:30' } });
    expect(submittedValue()).toBe('2026-03-08T08:30');
    expect(input.value).toBe('03/08/2026 08:30');
    expect(screen.queryByRole('alert')).toBeNull();

    fireEvent.change(input, { target: { value: '03/09/2026 17:01' } });
    fireEvent.blur(input);
    expect(screen.getByRole('alert').textContent).toContain('on or before');

    fireEvent.change(input, { target: { value: '03/09/2026 17:00' } });
    expect(submittedValue()).toBe('2026-03-09T17:00');

    fireEvent.change(input, { target: { value: '03/09/2026 24:00' } });
    expect(input.checkValidity()).toBe(false);
});

it.each([
    [
        'it',
        '24/11/2026',
        'Scegli la data per Expiry',
        'lunedì',
        'Vai al mese successivo',
    ],
    [
        'de',
        '24.11.2026',
        'Datum für Expiry auswählen',
        'Montag',
        'Zum nächsten Monat',
    ],
])(
    'formats and labels the calendar in %s with Monday first',
    async (language, date, trigger, weekday, next) => {
        await i18n.changeLanguage(language);
        render(<PickerForm value="2026-11-24" />);

        expect(
            screen.getByRole<HTMLInputElement>('textbox', { name: 'Expiry' })
                .value,
        ).toBe(date);
        fireEvent.click(screen.getByRole('button', { name: trigger }));
        const dialog = screen.getByRole('dialog', { name: trigger });

        expect(
            within(dialog)
                .getAllByRole('columnheader', { hidden: true })[0]
                .getAttribute('aria-label'),
        ).toBe(weekday);
        expect(within(dialog).getByRole('button', { name: next })).toBeTruthy();
    },
);

it('uses the selected zone for today and the chosen day, with focus restored', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-27T01:00:00Z'));
    render(
        <PickerForm
            hasTime
            timeZone="America/New_York"
            min="2026-11-26T10:00"
            max="2026-11-27T17:00"
        />,
    );
    const trigger = screen.getByRole('button', {
        name: 'Choose date for Expiry',
    });
    trigger.focus();
    fireEvent.click(trigger);
    const today = screen.getByRole('button', {
        name: 'Today, Thursday, November 26, 2026',
    });

    await waitFor(() => expect(document.activeElement).toBe(today));
    fireEvent.keyDown(today, { key: 'ArrowRight' });
    await waitFor(() =>
        expect(document.activeElement).toBe(
            screen.getByRole('button', { name: 'Friday, November 27, 2026' }),
        ),
    );
    fireEvent.keyDown(document.activeElement ?? trigger, { key: 'ArrowLeft' });
    await waitFor(() => expect(document.activeElement).toBe(today));
    expect(
        screen.getByRole<HTMLButtonElement>('button', {
            name: 'Wednesday, November 25, 2026',
        }).disabled,
    ).toBe(true);
    fireEvent.click(today);
    expect(submittedValue()).toBe('2026-11-26T10:00');
    expect(screen.getByRole('status').textContent).toContain(
        '11/26/2026 10:00',
    );
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    fireEvent.click(trigger);
    fireEvent.keyDown(document.activeElement ?? trigger, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(trigger));

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Clear' }));
    expect(submittedValue()).toBe('');
    expect(screen.getByRole('status').textContent).toContain(
        'Expiry: no value',
    );
});

it('preserves a non-canonical stored value until it is corrected', () => {
    const stored = '2026-11-24T00:00:00.000000Z';
    render(<PickerForm value={stored} />);
    const input = screen.getByRole<HTMLInputElement>('textbox', {
        name: 'Expiry',
    });

    expect(input.value).toBe(stored);
    expect(input.validity.valid).toBe(false);
    expect(submittedValue()).toBe(stored);

    fireEvent.change(input, { target: { value: '11/24/2026' } });
    expect(input.validity.valid).toBe(true);
    expect(submittedValue()).toBe('2026-11-24');
});

it.each([
    [{ timeZone: 'Europe/Unknown' }, 'The time zone is invalid.'],
    [{ min: '2026-11-26' }, 'The available dates are configured incorrectly.'],
    [
        { min: '2026-11-26T12:00', max: '2026-11-26T10:00' },
        'The available dates are configured incorrectly.',
    ],
])('fails closed for invalid picker configuration %j', (props, message) => {
    render(<PickerForm hasTime value="2026-11-26T11:00" {...props} />);

    expect(
        screen.getByRole<HTMLButtonElement>('button', {
            name: 'Choose date for Expiry',
        }).disabled,
    ).toBe(true);
    expect(screen.getByRole('alert').textContent).toBe(message);
    expect(submittedValue()).toBe('2026-11-26T11:00');
});
