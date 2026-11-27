import { expect, it } from 'vitest';
import { nextToolbarLayout } from '@/components/admin/data-table-toolbar';

it('steps to a narrower layout only while the content overflows', () => {
    expect(
        nextToolbarLayout({
            layout: 'inline',
            clientWidth: 900,
            scrollWidth: 900,
            neededWidths: {},
        }),
    ).toBe('inline');
    expect(
        nextToolbarLayout({
            layout: 'inline',
            clientWidth: 900,
            scrollWidth: 1100,
            neededWidths: {},
        }),
    ).toBe('collapsed');
    expect(
        nextToolbarLayout({
            layout: 'collapsed',
            clientWidth: 360,
            scrollWidth: 480,
            neededWidths: { inline: 1100 },
        }),
    ).toBe('stacked');
});

it('steps back only once the wider layout fits, so layouts never flip', () => {
    const neededWidths = { inline: 1100, collapsed: 480 };

    expect(
        nextToolbarLayout({
            layout: 'collapsed',
            clientWidth: 1099,
            scrollWidth: 700,
            neededWidths,
        }),
    ).toBe('collapsed');
    expect(
        nextToolbarLayout({
            layout: 'collapsed',
            clientWidth: 1100,
            scrollWidth: 700,
            neededWidths,
        }),
    ).toBe('inline');
    expect(
        nextToolbarLayout({
            layout: 'stacked',
            clientWidth: 479,
            scrollWidth: 300,
            neededWidths,
        }),
    ).toBe('stacked');
});
