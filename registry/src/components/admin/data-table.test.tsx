import type { ColumnDef } from '@tanstack/react-table';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { DataTable } from '@/components/admin/data-table';

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: String }) }));

const record = { id: 'incident', name: 'Failed backup' };
const actionLabel = 'Dismiss';

function renderTable(onRowClick?: (row: typeof record) => void) {
    const columns: ColumnDef<typeof record>[] = [
        { accessorKey: 'name', header: 'Name' },
        {
            id: 'actions',
            header: 'Actions',
            meta: { isRowClickIgnored: true },
            cell: () => <button type="button">{actionLabel}</button>,
        },
    ];

    render(
        <DataTable
            columns={columns}
            data={[record]}
            getRowId={(row) => row.id}
            onRowClick={onRowClick}
        />,
    );

    return screen.getByRole('row', { name: /Failed backup/ });
}

afterEach(cleanup);

it('opens a focusable row by click, Enter and Space', () => {
    const openRecord = vi.fn();
    const row = renderTable(openRecord);

    expect(row.tabIndex).toBe(0);
    row.focus();
    expect(document.activeElement).toBe(row);
    expect(screen.getByRole('cell', { name: record.name })).toBeTruthy();

    fireEvent.click(screen.getByRole('cell', { name: record.name }));
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(openRecord.mock.calls).toEqual([[record], [record]]);

    expect(fireEvent.keyDown(row, { key: ' ' })).toBe(false);
    expect(openRecord).toHaveBeenCalledTimes(2);
    fireEvent.keyUp(row, { key: ' ' });
    expect(openRecord).toHaveBeenLastCalledWith(record);
    expect(openRecord).toHaveBeenCalledTimes(3);
});

it('leaves clicks and key presses in an action cell to its own control', () => {
    const openRecord = vi.fn();
    renderTable(openRecord);
    const action = screen.getByRole('button', { name: actionLabel });
    action.focus();

    expect(fireEvent.keyDown(action, { key: ' ' })).toBe(true);
    fireEvent.keyUp(action, { key: ' ' });
    fireEvent.keyDown(action, { key: 'Enter' });
    fireEvent.click(action);

    expect(openRecord).not.toHaveBeenCalled();
});

it('keeps non-actionable rows out of the tab order', () => {
    expect(renderTable().getAttribute('tabindex')).toBeNull();
});
