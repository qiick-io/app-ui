import { useState } from 'react';
import { DataTable } from '@/components/admin/data-table';
import {
    ApiKeyRevokeDialog,
    useApiKeyColumns,
} from '@/components/api-keys/api-key-list-row';
import type { ApiKeyListRow } from '@/components/api-keys/api-key-list-row';

const KEYS: ApiKeyListRow[] = [
    {
        id: 1,
        name: 'Zapier sync',
        key_prefix: 'qk_7fK2pQ9x',
        scopes: ['posts:write', 'files:read'],
        expires_at: '2027-03-01T00:00:00Z',
        last_used_at: '2026-11-16T09:12:00Z',
        revoked_at: null,
    },
    {
        id: 2,
        name: 'Claude Desktop',
        key_prefix: 'qk_Lm4vT8nR',
        scopes: ['mcp:write'],
        expires_at: null,
        last_used_at: null,
        revoked_at: null,
    },
    {
        id: 3,
        name: 'Old import script',
        key_prefix: 'qk_1sW6yZ3b',
        scopes: ['posts:read'],
        expires_at: '2026-10-01T00:00:00Z',
        last_used_at: '2026-09-30T18:40:00Z',
        revoked_at: null,
    },
    {
        id: 4,
        name: 'Leaked CI key',
        key_prefix: 'qk_C5dH0jE2',
        scopes: [],
        expires_at: null,
        last_used_at: '2026-08-02T11:05:00Z',
        revoked_at: '2026-08-02T11:30:00Z',
    },
];

export default function ApiKeyListRowDemo() {
    const [pendingRevokeKey, setPendingRevokeKey] =
        useState<ApiKeyListRow | null>(null);
    const columns = useApiKeyColumns<ApiKeyListRow>({
        onRotate: () => undefined,
        onRevoke: setPendingRevokeKey,
    });

    return (
        <>
            <DataTable
                columns={columns}
                data={KEYS}
                getRowId={(key) => String(key.id)}
            />
            <ApiKeyRevokeDialog
                keyName={pendingRevokeKey?.name ?? null}
                onOpenChange={(isNextOpen) => {
                    if (!isNextOpen) {
                        setPendingRevokeKey(null);
                    }
                }}
                onConfirm={() => setPendingRevokeKey(null)}
            />
        </>
    );
}
