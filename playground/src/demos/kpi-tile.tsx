import { KpiTile, kpiDeltaOf } from '@/components/charts/kpi-tile';
import { Sparkline } from '@/components/charts/sparkline';
import { dailySeries } from '../screens/excubia-data';

/**
 * Key numbers (docs/charts.md): a fall that is good news, a rise that is bad news, a
 * neutral change, and a ratio with no trend and so no sparkline.
 */
export default function KpiTileDemo() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <KpiTile
                label="Open findings"
                value="45"
                delta={kpiDeltaOf(45, 46, false)}
                secondary="vs previous 30 days"
                chart={<Sparkline values={dailySeries(45, 4, 1)} />}
            />
            <KpiTile
                label="Open exceptions"
                value="7"
                delta={kpiDeltaOf(7, 5, false)}
                secondary="8 events"
                chart={<Sparkline values={dailySeries(7, 3, 7)} />}
            />
            <KpiTile
                label="Requests, last 24h"
                value="603"
                delta={kpiDeltaOf(603, 579, null)}
                secondary="0 server errors · avg 152.9 ms"
                chart={<Sparkline values={dailySeries(603, 60, 2)} />}
            />
            <KpiTile
                label="Runtimes supported"
                value="3/3"
                secondary="PHP, Laravel, Node"
            />
        </div>
    );
}
