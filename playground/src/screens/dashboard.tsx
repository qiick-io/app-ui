import { BarChart3 } from 'lucide-react';
import { PageEmptyState } from '@/components/admin/page-empty-state';
import { EntityBarChart } from '@/components/charts/entity-bar-chart';
import { KpiTile, kpiDeltaOf } from '@/components/charts/kpi-tile';
import { SegmentedBar } from '@/components/charts/segmented-bar';
import { Sparkline } from '@/components/charts/sparkline';
import { TimeSeriesChart } from '@/components/charts/time-series-chart';
import { PageLayout } from '@/components/layout/page-layout';
import { Card } from '@/components/ui/card';
import { DemoShell } from './demo-shell';
import {
    AGENT_METRICS,
    AGENT_SERIES,
    OUTCOME_SEGMENTS,
    PROJECT_FINDINGS,
    SEVERITY_SEGMENTS,
    dailySeries,
    formatShortDate,
} from './excubia-data';

function Ratio({ value, total }: { value: number; total: number }) {
    return (
        <>
            {value}
            <span className="text-lg text-muted-foreground">/{total}</span>
        </>
    );
}

/**
 * `#/dashboard`: the Excubia project overview rebuilt with the chart and KPI pattern
 * (docs/charts.md): the KPI row, the compositions card, one time series and one
 * comparison between projects.
 */
export function DashboardScreen() {
    return (
        <DemoShell
            active="dashboard"
            breadcrumbs={[{ title: 'Project overview', href: '#/dashboard' }]}
        >
            <PageLayout description="excubia-app, last 30 days" scrollContent>
                <div className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <KpiTile
                            label="Open findings"
                            value="45"
                            delta={kpiDeltaOf(45, 46, false)}
                            secondary="vs previous 30 days"
                            chart={<Sparkline values={dailySeries(45, 4, 1)} />}
                        />
                        <KpiTile
                            label="Checks passing"
                            value={<Ratio value={25} total={41} />}
                            delta={kpiDeltaOf(25, 25, true)}
                            secondary="2 failed · 3 warnings"
                            chart={<Sparkline values={dailySeries(25, 2, 4)} />}
                        />
                        <KpiTile
                            label="Runtimes supported"
                            value={<Ratio value={3} total={3} />}
                            secondary="PHP, Laravel, Node"
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
                            chart={
                                <Sparkline values={dailySeries(603, 60, 2)} />
                            }
                        />
                    </div>
                    <Card className="gap-0 py-0">
                        <div className="grid gap-6 p-4 md:grid-cols-2">
                            <section className="flex flex-col gap-3">
                                <h2 className="text-sm font-medium">
                                    Open findings by severity
                                </h2>
                                <SegmentedBar
                                    title="Open findings by severity"
                                    segments={SEVERITY_SEGMENTS}
                                />
                            </section>
                            <section className="flex flex-col gap-3">
                                <h2 className="text-sm font-medium">
                                    Check outcomes
                                </h2>
                                <SegmentedBar
                                    title="Check outcomes"
                                    segments={OUTCOME_SEGMENTS}
                                />
                            </section>
                        </div>
                    </Card>
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                        <TimeSeriesChart
                            className="xl:col-span-8"
                            title="Agent usage"
                            series={AGENT_SERIES}
                            metrics={AGENT_METRICS}
                            formatDate={formatShortDate}
                            metricSwitchLabel="Metric"
                            dateColumnHeader="Date"
                            emptyState={
                                <PageEmptyState
                                    compact
                                    icon={BarChart3}
                                    title="No agent runs"
                                    description="Runs appear here once an agent works on this project."
                                />
                            }
                        />
                        <Card className="gap-4 py-4 xl:col-span-4">
                            <h2 className="px-4 text-sm font-medium">
                                Open findings by project
                            </h2>
                            <div className="px-4">
                                <EntityBarChart
                                    title="Open findings by project"
                                    valueLabel="Open findings"
                                    entityColumnHeader="Project"
                                    entities={PROJECT_FINDINGS}
                                />
                            </div>
                        </Card>
                    </div>
                </div>
            </PageLayout>
        </DemoShell>
    );
}
