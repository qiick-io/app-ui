import { ChartDataTable } from '@/components/charts/chart-data-table';
import { PROJECT_FINDINGS } from '../screens/excubia-data';

/** Visually hidden on purpose: inspect it with a screen reader or the accessibility tree. */
export default function ChartDataTableDemo() {
    return (
        <div className="text-sm text-muted-foreground">
            <span>A hidden table follows (screen readers only).</span>
            <ChartDataTable
                caption="Open findings by project"
                columnHeaders={['Project', 'Open findings']}
                rows={PROJECT_FINDINGS.map((project) => ({
                    header: project.label,
                    values: [String(project.value)],
                }))}
            />
        </div>
    );
}
