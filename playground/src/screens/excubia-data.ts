import type { EntityBarDatum } from '@/components/charts/entity-bar-chart';
import type { SegmentedBarSegment } from '@/components/charts/segmented-bar';
import type {
    TimeSeriesMetric,
    TimeSeriesRow,
    TimeSeriesSeries,
} from '@/components/charts/time-series-chart';

/**
 * Excubia-like sample data for the dashboard screen and the chart demos. Every series is
 * computed, never random, so screenshots stay stable between runs.
 */

/** A 30-day series that ends exactly at `last`. */
export function dailySeries(
    last: number,
    swing: number,
    seed: number,
): number[] {
    const wave = (dayIndex: number) => Math.sin((dayIndex + seed) / 3) * swing;

    return Array.from({ length: 30 }, (_, dayIndex) => {
        const drift = ((29 - dayIndex) / 29) * swing * 0.6;

        return Math.max(
            0,
            Math.round(last + wave(dayIndex) - wave(29) + drift),
        );
    });
}

export const SEVERITY_SEGMENTS: SegmentedBarSegment[] = [
    { tone: 'critical', label: 'Critical', value: 0 },
    { tone: 'high', label: 'High', value: 0 },
    { tone: 'medium', label: 'Medium', value: 20 },
    { tone: 'low', label: 'Low', value: 18 },
    { tone: 'info', label: 'Info', value: 7 },
];

export const OUTCOME_SEGMENTS: SegmentedBarSegment[] = [
    { tone: 'fail', label: 'Failed', value: 2 },
    { tone: 'warn', label: 'Warnings', value: 3 },
    { tone: 'pass', label: 'Passed', value: 25 },
    { tone: 'skipped', label: 'Skipped', value: 11 },
];

export const PROJECT_FINDINGS: EntityBarDatum[] = [
    { label: 'externa-core', value: 45 },
    { label: 'excubia-app', value: 31 },
    { label: 'filegrant', value: 18 },
    { label: 'signaculum', value: 9 },
    { label: 'app-ui', value: 4 },
];

export const AGENT_SERIES: TimeSeriesSeries[] = [
    { key: 'claude', label: 'Claude' },
    { key: 'codex', label: 'Codex' },
    { key: 'other', label: 'Other' },
];

const DAY_IN_MILLISECONDS = 24 * 60 * 60 * 1000;
const PERIOD_END = Date.UTC(2026, 10, 27);

function agentRows(scale: number): TimeSeriesRow[] {
    const claude = dailySeries(12 * scale, 4 * scale, 1);
    const codex = dailySeries(7 * scale, 3 * scale, 5);
    const other = dailySeries(2 * scale, scale, 9);

    return claude.map((value, dayIndex) => ({
        date: new Date(PERIOD_END - (29 - dayIndex) * DAY_IN_MILLISECONDS)
            .toISOString()
            .slice(0, 10),
        claude: value,
        codex: codex[dayIndex] ?? 0,
        other: other[dayIndex] ?? 0,
    }));
}

export const AGENT_METRICS: TimeSeriesMetric[] = [
    {
        key: 'time',
        label: 'Agent time',
        formatValue: (value) => {
            const minutes = Math.round(value);

            if (minutes < 60) {
                return `${minutes}m`;
            }

            const hours = `${Math.floor(minutes / 60)}h`;

            return minutes % 60 === 0 ? hours : `${hours} ${minutes % 60}m`;
        },
        rows: agentRows(10),
    },
    {
        key: 'cost',
        label: 'Cost',
        formatValue: (cents) => `$${(cents / 100).toFixed(2)}`,
        rows: agentRows(40),
    },
    {
        key: 'tokens',
        label: 'Tokens',
        formatValue: (tokens) =>
            tokens >= 1000
                ? `${(tokens / 1000).toFixed(1)}k`
                : `${Math.round(tokens)}`,
        rows: agentRows(900),
    },
];

/** "Nov 3" from an ISO date, in UTC so the label never shifts by a day. */
export function formatShortDate(isoDate: string): string {
    return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString('en', {
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
    });
}
