import { cleanup, render, screen, within } from '@testing-library/react';
import { createInstance } from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { afterEach, expect, it } from 'vitest';
import { DataTable } from '@/components/admin/data-table';
import { useApiKeyColumns } from '@/components/api-keys/api-key-list-row';
import type { ApiKeyListRow } from '@/components/api-keys/api-key-list-row';
import de from '../../../locales/de.json';

const lastUsedAt = '2026-11-26T12:05:00Z';
const expiresAt = '2026-11-26T12:10:00Z';
const keys: ApiKeyListRow[] = [
    {
        id: 'used',
        name: 'Backup key',
        key_prefix: 'qk_first',
        scopes: [],
        expires_at: expiresAt,
        last_used_at: lastUsedAt,
        revoked_at: expiresAt,
    },
    {
        id: 'unused',
        name: 'Unused key',
        key_prefix: 'qk_second',
        scopes: [],
        expires_at: null,
        last_used_at: null,
        revoked_at: expiresAt,
    },
];

/** Renders the registry columns through the same table that product pages use. */
function ApiKeyTable() {
    const columns = useApiKeyColumns<ApiKeyListRow>({
        onRevoke: () => undefined,
    });

    return (
        <DataTable
            columns={columns}
            data={keys}
            getRowId={(key) => String(key.id)}
        />
    );
}

afterEach(cleanup);

it('shows the localized date and time for both timestamps and labels null values', async () => {
    const i18n = createInstance();
    await i18n.init({ lng: 'de', resources: { de: { translation: de } } });

    render(
        <I18nextProvider i18n={i18n}>
            <ApiKeyTable />
        </I18nextProvider>,
    );

    const dateTimeFormat = new Intl.DateTimeFormat('de', {
        dateStyle: 'medium',
        timeStyle: 'short',
    });
    const usedRow = within(screen.getByRole('row', { name: /Backup key/ }));
    const unusedRow = within(screen.getByRole('row', { name: /Unused key/ }));

    expect(
        usedRow.getByRole('cell', {
            name: dateTimeFormat.format(new Date(lastUsedAt)),
        }),
    ).toBeTruthy();
    expect(
        usedRow.getByRole('cell', {
            name: dateTimeFormat.format(new Date(expiresAt)),
        }),
    ).toBeTruthy();
    expect(
        unusedRow.getByRole('cell', { name: de.apiKeys.list.neverUsed }),
    ).toBeTruthy();
    expect(
        unusedRow.getByRole('cell', { name: de.apiKeys.list.never }),
    ).toBeTruthy();
});
