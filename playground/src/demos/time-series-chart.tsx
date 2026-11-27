import { BarChart3 } from 'lucide-react';
import { PageEmptyState } from '@/components/admin/page-empty-state';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';
import {
    AGENT_METRICS,
    AGENT_SERIES,
    formatShortDate,
} from '../screens/excubia-data';

const EMPTY_STATE = (
    <PageEmptyState
        compact
        icon={BarChart3}
        title="No agent runs"
        description="Runs appear here once an agent works on this project."
    />
);

/** Agent usage with the metric switch and series toggles, then the loading and empty states. */
export default function TimeSeriesChartDemo() {
    const sharedProps = {
        title: 'Agent usage',
        series: AGENT_SERIES,
        formatDate: formatShortDate,
        metricSwitchLabel: 'Metric',
        dateColumnHeader: 'Date',
        emptyState: EMPTY_STATE,
    };

    return (
        <div className="flex flex-col gap-4">
            <TimeSeriesChart {...sharedProps} metrics={AGENT_METRICS} />
            <TimeSeriesChart
                {...sharedProps}
                metrics={AGENT_METRICS}
                isLoading
            />
            <TimeSeriesChart
                {...sharedProps}
                metrics={AGENT_METRICS.map((metric) => ({
                    ...metric,
                    rows: [],
                }))}
            />
        </div>
    );
}
