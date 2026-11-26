import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';
import i18n from 'i18next';
import { useState } from 'react';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { ApiKeyScopePicker } from '@/components/api-keys/api-key-scope-picker';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from '@/components/ui/dialog';
import en from '../../../locales/en.json';

const DIALOG_TITLE = 'Create API key';
const DIALOG_DESCRIPTION = 'Choose permissions for the key.';

/** The create form keeps the persisted scopes shape while a user changes a permission. */
function ScopePickerDialog() {
    const [scopes, setScopes] = useState(['files:read']);

    return (
        <Dialog open>
            <DialogContent>
                <DialogTitle>{DIALOG_TITLE}</DialogTitle>
                <DialogDescription>{DIALOG_DESCRIPTION}</DialogDescription>
                <form>
                    <ApiKeyScopePicker
                        resources={[
                            {
                                resource: 'mcp',
                                label: 'AI clients (MCP server)',
                            },
                            {
                                resource: 'files',
                                label: 'Files',
                                availableActions: ['read'],
                            },
                        ]}
                        value={scopes}
                        onChange={setScopes}
                    />
                    <output aria-label="Selected scopes">
                        {scopes.join(', ')}
                    </output>
                </form>
            </DialogContent>
        </Dialog>
    );
}

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: en } },
    });
});

afterEach(cleanup);

it('lets the user choose and clear an MCP scope inside a dialog', () => {
    render(<ScopePickerDialog />);

    const dialog = within(screen.getByRole('dialog', { name: DIALOG_TITLE }));
    const permission = dialog.getByRole('combobox', {
        name: 'AI clients (MCP server)',
    });
    const scopes = dialog.getByRole('status', { name: 'Selected scopes' });
    const filesPermission = dialog.getByRole('combobox', { name: 'Files' });

    expect(
        within(permission)
            .getAllByRole('option')
            .map((option) => option.textContent),
    ).toEqual(['No access', 'Read', 'Write']);
    expect(
        within(filesPermission).queryByRole('option', { name: 'Write' }),
    ).toBeNull();
    expect(permission).toHaveProperty('value', 'none');
    fireEvent.change(permission, { target: { value: 'write' } });
    expect(scopes.textContent).toBe('files:read, mcp:write');
    fireEvent.change(permission, { target: { value: 'read' } });
    expect(scopes.textContent).toBe('files:read, mcp:read');
    fireEvent.change(permission, { target: { value: 'none' } });
    expect(scopes.textContent).toBe('files:read');
});

it('shows why access is unavailable when no action is grantable', () => {
    render(
        <ApiKeyScopePicker
            resources={[
                {
                    resource: 'mcp',
                    label: 'AI clients (MCP server)',
                    availableActions: [],
                },
            ]}
            value={['mcp:read']}
            onChange={vi.fn()}
        />,
    );

    const permission = screen.getByRole('combobox', {
        name: 'AI clients (MCP server)',
        description: en.apiKeys.scopes.unavailable,
    });
    expect(permission).toHaveProperty('value', 'none');
    expect(permission).toHaveProperty('disabled', true);
});
