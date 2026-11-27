import { EntityBarChart } from '@/components/charts/entity-bar-chart';
import { PROJECT_FINDINGS } from '../screens/excubia-data';

/** Projects compared on one measure, the value on every bar. */
export default function EntityBarChartDemo() {
    return (
        <EntityBarChart
            title="Open findings by project"
            valueLabel="Open findings"
            entityColumnHeader="Project"
            entities={PROJECT_FINDINGS}
        />
    );
}
