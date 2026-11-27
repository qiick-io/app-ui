import { Sparkline } from '@/components/charts/sparkline';
import { dailySeries } from '../screens/excubia-data';

/** A 30-day trend; inside a `KpiTile` it bleeds to the tile's edges. */
export default function SparklineDemo() {
    return (
        <div className="max-w-xs rounded-lg border">
            <Sparkline values={dailySeries(603, 60, 2)} />
        </div>
    );
}
