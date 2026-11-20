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
import { PaginatedMultiSelect } from '@/components/admin/paginated-multi-select';
import type { RecordId } from '@/lib/record-id';
import en from '../../../locales/en.json';

type PickerPage = {
    data: Array<{ id: RecordId; label: string }>;
    current_page: number;
    last_page: number;
};

/** Controlled host, like a form field: what `onChange` returns is the value. */
function PickerHarness({
    recordIds,
    initialValue = [],
    multiple = true,
}: {
    recordIds: RecordId[];
    initialValue?: RecordId[];
    multiple?: boolean;
}) {
    const [value, setValue] = useState<RecordId[]>(initialValue);
    const options = recordIds.map((recordId) => ({
        id: recordId,
        label: `Person ${String(recordId)}`,
    }));
    const page: PickerPage = {
        data: options,
        current_page: 1,
        last_page: 1,
    };

    vi.stubGlobal(
        'fetch',
        vi.fn(async () => ({
            ok: true,
            json: async () => page,
        })),
    );

    return (
        <>
            <PaginatedMultiSelect
                aria-label="People"
                fetchUrl="/api/people"
                value={value}
                onChange={setValue}
                multiple={multiple}
                initialOptions={options.filter((option) =>
                    initialValue.includes(option.id),
                )}
            />
            <output data-testid="value">{JSON.stringify(value)}</output>
        </>
    );
}

/** The option's label is the accessible name of its row in the command list. */
async function selectOption(label: string): Promise<void> {
    const option = await screen.findByRole('option', { name: label });

    fireEvent.click(option);
}

function selectedValue(): string | null {
    return screen.getByTestId('value').textContent;
}

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: en } },
        interpolation: { escapeValue: false },
    });

    Element.prototype.hasPointerCapture ??= () => false;
    Element.prototype.setPointerCapture ??= () => {};
    Element.prototype.releasePointerCapture ??= () => {};
    Element.prototype.scrollIntoView ??= () => {};

    if (!globalThis.ResizeObserver) {
        globalThis.ResizeObserver = class {
            observe(): void {}
            unobserve(): void {}
            disconnect(): void {}
        };
    }
});

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

describe('PaginatedMultiSelect record ids', () => {
    const stringIds = [
        '9f1b2c4d-0000-4000-8000-000000000001',
        '9f1b2c4d-0000-4000-8000-000000000002',
    ];

    it('selects and deselects a UUID without coercing it', async () => {
        render(<PickerHarness recordIds={stringIds} />);
        fireEvent.click(screen.getByRole('combobox', { name: 'People' }));

        await selectOption(`Person ${stringIds[0]}`);
        await waitFor(() =>
            expect(selectedValue()).toBe(JSON.stringify([stringIds[0]])),
        );

        await selectOption(`Person ${stringIds[0]}`);
        await waitFor(() => expect(selectedValue()).toBe('[]'));
    });

    it('round-trips an initial UUID value and its label', async () => {
        render(
            <PickerHarness
                recordIds={stringIds}
                initialValue={[stringIds[1]]}
            />,
        );

        expect(selectedValue()).toBe(JSON.stringify([stringIds[1]]));
        expect(screen.getByText(`Person ${stringIds[1]}`)).toBeTruthy();

        fireEvent.click(screen.getByRole('combobox', { name: 'People' }));
        await selectOption(`Person ${stringIds[1]}`);
        await waitFor(() => expect(selectedValue()).toBe('[]'));
    });

    it('selects and deselects numeric ids as numbers', async () => {
        render(<PickerHarness recordIds={[1, 2]} />);
        fireEvent.click(screen.getByRole('combobox', { name: 'People' }));

        await selectOption('Person 2');
        await waitFor(() => expect(selectedValue()).toBe('[2]'));

        await selectOption('Person 2');
        await waitFor(() => expect(selectedValue()).toBe('[]'));
    });

    it('replaces the selection in single-select mode with a UUID', async () => {
        render(
            <PickerHarness
                recordIds={stringIds}
                initialValue={[stringIds[0]]}
                multiple={false}
            />,
        );
        fireEvent.click(screen.getByRole('combobox', { name: 'People' }));

        await selectOption(`Person ${stringIds[1]}`);
        await waitFor(() =>
            expect(selectedValue()).toBe(JSON.stringify([stringIds[1]])),
        );
    });
});
