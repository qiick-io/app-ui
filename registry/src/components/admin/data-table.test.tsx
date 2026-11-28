import type { ColumnDef } from '@tanstack/react-table';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { DataTable } from '@/components/admin/data-table';
import en from '../../../locales/en.json';

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

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: en } },
        interpolation: { escapeValue: false },
    });
});

afterEach(cleanup);

it('opens a focusable row by click, Enter and Space', () => {
    const openRecord = vi.fn();
    const row = renderTable(openRecord);

    expect(row.tabIndex).toBe(0);
    row.focus();
    expect(document.activeElement).toBe(row);
    expect(screen.getByRole('row', { description: en.a11y.openTableRow })).toBe(
        row,
    );
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

it('ignores repeated Enter, an unpaired Space release, and Space after blur', () => {
    const openRecord = vi.fn();
    const row = renderTable(openRecord);
    row.focus();

    fireEvent.keyDown(row, { key: 'Enter' });
    fireEvent.keyDown(row, { key: 'Enter', repeat: true });
    fireEvent.keyUp(row, { key: ' ' });
    fireEvent.keyDown(row, { key: ' ' });
    row.blur();
    row.focus();
    fireEvent.keyUp(row, { key: ' ' });

    expect(openRecord).toHaveBeenCalledTimes(1);
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

it('pins columns with sticky offsets and keeps the cell order', () => {
    const columns: ColumnDef<typeof record>[] = [
        { id: 'select', size: 40, header: 'Select', cell: () => null },
        { accessorKey: 'name', header: 'Name' },
        { id: 'owner', header: 'Owner', cell: () => 'Ada' },
        { id: 'actions', size: 72, header: 'Actions', cell: () => null },
    ];

    render(
        <DataTable
            columns={columns}
            data={[record]}
            getRowId={(row) => row.id}
            columnPinning={{ left: ['select', 'name'], right: ['actions'] }}
        />,
    );

    const headers = screen.getAllByRole('columnheader');
    expect(headers.map((header) => header.textContent)).toEqual([
        'Select',
        'Name',
        'Owner',
        'Actions',
    ]);
    expect(headers[0].dataset.pinned).toBe('left');
    expect(headers[0].dataset.pinnedEdge).toBeUndefined();
    // Non-edge left pins render at exactly `size`, so the next sticky offset has no gap.
    expect(headers[0].style.width).toBe('40px');
    expect(headers[0].style.minWidth).toBe('40px');
    expect(headers[0].style.maxWidth).toBe('40px');
    expect(headers[1].style.left).toBe('40px');
    expect(headers[1].dataset.pinnedEdge).toBe('');
    // jsdom may rewrite `calc(50vw - 72px)` to `-72px + 50vw`; both keep the right pin out.
    expect(headers[1].style.maxWidth).toMatch(/50vw/);
    expect(headers[1].style.maxWidth).toMatch(/72px/);
    expect(headers[1].style.maxWidth).toMatch(/32rem/);
    expect(headers[2].dataset.pinned).toBeUndefined();
    expect(headers[3].dataset.pinned).toBe('right');
    expect(headers[3].style.right).toBe('0px');
    expect(screen.getByRole('cell', { name: record.name }).dataset.pinned).toBe(
        'left',
    );
    expect(screen.getByRole('cell', { name: record.name }).style.width).toBe(
        '',
    );
});
