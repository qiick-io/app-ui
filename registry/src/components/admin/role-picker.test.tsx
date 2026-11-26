import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { humanizeRoleName, RolePicker } from '@/components/admin/role-picker';
import en from '../../../locales/en.json';

/** Controlled host, like a form field: what `onChange` returns is the value. */
function RolePickerHarness({ initialValue = [] }: { initialValue?: string[] }) {
    const [value, setValue] = useState<string[]>(initialValue);

    return (
        <>
            <RolePicker
                roles={[
                    { name: 'super-admin', label: 'Super Admin' },
                    { name: 'admin', label: 'Admin' },
                    { name: 'reader' },
                ]}
                value={value}
                onChange={setValue}
            />
            <output data-testid="value">{JSON.stringify(value)}</output>
        </>
    );
}

function checkbox(name: string): HTMLElement {
    return screen.getByRole('checkbox', { name });
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
});

afterEach(() => {
    cleanup();
});

describe('RolePicker', () => {
    it('combines ordinary roles and says permissions add up', () => {
        render(<RolePickerHarness />);

        fireEvent.click(checkbox('Admin'));
        fireEvent.click(checkbox('Reader'));

        expect(selectedValue()).toBe('["admin","reader"]');
        expect(
            screen.getByText('Permissions from every selected role add up.'),
        ).toBeTruthy();
    });

    it('makes super-admin exclusive: clears and disables the other roles', () => {
        render(<RolePickerHarness initialValue={['admin']} />);

        fireEvent.click(checkbox('Super Admin'));

        expect(selectedValue()).toBe('["super-admin"]');
        expect(checkbox('Admin')).toHaveProperty('disabled', true);
        expect(checkbox('Reader')).toHaveProperty('disabled', true);

        fireEvent.click(checkbox('Super Admin'));

        expect(selectedValue()).toBe('[]');
        expect(checkbox('Admin')).toHaveProperty('disabled', false);
    });

    it('keeps a role saved next to super-admin clearable', () => {
        render(<RolePickerHarness initialValue={['super-admin', 'admin']} />);

        expect(checkbox('Admin')).toHaveProperty('disabled', false);
        expect(checkbox('Reader')).toHaveProperty('disabled', true);

        fireEvent.click(checkbox('Admin'));

        expect(selectedValue()).toBe('["super-admin"]');
    });

    it('keeps the exclusivity hint next to an app description', () => {
        render(
            <RolePicker
                roles={[{ name: 'super-admin', description: 'Owner.' }]}
                value={[]}
                onChange={() => {}}
                isRequired
            />,
        );

        expect(
            screen.getByText(
                'Owner. Every permission. Cannot be combined with other roles.',
            ),
        ).toBeTruthy();
        expect(screen.getByText(/Roles \*/)).toBeTruthy();
    });

    it('labels a role without a label from its name', () => {
        expect(humanizeRoleName('super-admin')).toBe('Super admin');
        expect(humanizeRoleName('org_owner')).toBe('Org owner');
    });
});
