import {
    cleanup,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react';
import { afterEach, beforeAll, expect, it } from 'vitest';
import { kpiDeltaOf } from '@/components/charts/kpi-tile';
import { SegmentedBar } from '@/components/charts/segmented-bar';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';
import type { TimeSeriesMetric } from '@/components/charts/time-series-chart';

beforeAll(() => {
    // jsdom has no ResizeObserver; Recharts' ResponsiveContainer only needs it to exist.
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    };
});

afterEach(cleanup);

it('colours a delta by what the change means for the metric, not by its direction', () => {
    expect(kpiDeltaOf(45, 46, false)).toEqual({
        label: '-2.2%',
        direction: 'down',
        tone: 'good',
    });
    expect(kpiDeltaOf(7, 5, false)).toMatchObject({
        direction: 'up',
        tone: 'bad',
    });
    expect(kpiDeltaOf(30, 25, true)).toMatchObject({
        direction: 'up',
        tone: 'good',
    });
    expect(kpiDeltaOf(603, 579, null)).toMatchObject({ tone: 'neutral' });
    expect(kpiDeltaOf(25, 25, true)).toMatchObject({
        direction: 'flat',
        tone: 'neutral',
    });
    expect(kpiDeltaOf(25, null, true)).toBeNull();
});

it('prints every count in a named legend list, zero counts included', () => {
    const { container } = render(
        <SegmentedBar
            title="Open findings by severity"
            segments={[
                { tone: 'critical', label: 'Critical', value: 0 },
                { tone: 'medium', label: 'Medium', value: 20 },
                { tone: 'low', label: 'Low', value: 18 },
            ]}
        />,
    );
    const legend = screen.getByRole('list', {
        name: 'Open findings by severity',
    });

    expect(
        within(legend)
            .getAllByRole('listitem')
            .map((item) => item.textContent),
    ).toEqual(['Critical 0', 'Medium 20', 'Low 18']);
    // Only non-zero segments draw, sized by their count.
    expect(container.querySelector('.bg-chart-critical.h-full')).toBeNull();
    expect(
        (container.querySelector('.bg-chart-medium.h-full') as HTMLElement)
            .style.flexGrow,
    ).toBe('20');
});

const METRICS: TimeSeriesMetric[] = [
    {
        key: 'cost',
        label: 'Cost',
        formatValue: (cents) => `$${(cents / 100).toFixed(2)}`,
        rows: [
            { date: '2026-11-26', claude: 100, codex: 50 },
            { date: '2026-11-27', claude: 200, codex: 25 },
        ],
    },
    {
        key: 'tokens',
        label: 'Tokens',
        formatValue: (tokens) => `${tokens}`,
        rows: [
            { date: '2026-11-26', claude: 1000, codex: 0 },
            { date: '2026-11-27', claude: 500, codex: 0 },
        ],
    },
];

function renderChart(metrics = METRICS) {
    return render(
        <TimeSeriesChart
            title="Agent usage"
            series={[
                { key: 'claude', label: 'Claude' },
                { key: 'codex', label: 'Codex' },
            ]}
            metrics={metrics}
            formatDate={(date) => date}
            metricSwitchLabel="Metric"
            dateColumnHeader="Date"
            emptyState="No runs"
        />,
    );
}

it('shows series totals in the legend and recomputes them when the metric switches', () => {
    renderChart();

    expect(screen.getByRole('button', { name: 'Claude $3.00' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Codex $0.75' })).toBeTruthy();

    fireEvent.click(screen.getByRole('radio', { name: 'Tokens' }));

    expect(screen.getByRole('button', { name: 'Claude 1500' })).toBeTruthy();
    expect(
        screen.getByRole('table', { name: 'Agent usage, Tokens' }),
    ).toBeTruthy();
});

it('toggles a series but never hides the last visible one', () => {
    renderChart();
    const claude = screen.getByRole('button', { name: /Claude/ });
    const codex = screen.getByRole('button', { name: /Codex/ });

    fireEvent.click(codex);

    expect(codex.getAttribute('aria-pressed')).toBe('false');
    expect((claude as HTMLButtonElement).disabled).toBe(true);
});

it('shows the empty state instead of a plot when the period has no data', () => {
    renderChart(METRICS.map((metric) => ({ ...metric, rows: [] })));

    expect(screen.getByText('No runs')).toBeTruthy();
    expect(screen.queryByRole('table')).toBeNull();
    expect(screen.queryByRole('button', { name: /Claude/ })).toBeNull();
});
