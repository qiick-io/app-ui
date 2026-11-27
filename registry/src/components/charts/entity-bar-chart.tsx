import { Bar, BarChart, LabelList, XAxis } from 'recharts';
import { ChartDataTable } from '@/components/charts/chart-data-table';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

/** One entity on the shared measure (a project and its open findings). */
export type EntityBarDatum = { label: string; value: number };

/**
 * Entities compared on one measure, as vertical bars in one colour: colour would
 * suggest the bars mean different things. Every bar carries its value on top, so
 * nothing waits for hover, and a hidden table gives screen readers the same numbers.
 * Only for comparing entities; change over time is a `TimeSeriesChart`, a share of a
 * whole a `SegmentedBar`. Not animated, so reduced motion holds by construction.
 */
export function EntityBarChart({
    title,
    valueLabel,
    entityColumnHeader,
    entities,
    formatValue = (value) => value.toLocaleString(),
    className,
}: {
    /** The comparison, read as the table caption ("Open findings by project"). */
    title: string;
    /** The measure's name in the tooltip and table ("Open findings"). */
    valueLabel: string;
    /** First column header of the screen-reader table ("Project"). */
    entityColumnHeader: string;
    /** In the order to show, usually largest first. */
    entities: EntityBarDatum[];
    formatValue?: (value: number) => string;
    className?: string;
}) {
    const config = {
        value: { label: valueLabel, color: 'var(--chart-1)' },
    } satisfies ChartConfig;

    return (
        <>
            <ChartContainer
                config={config}
                className={cn('aspect-auto h-64 w-full', className)}
            >
                <BarChart
                    data={entities}
                    accessibilityLayer
                    margin={{ top: 20, right: 0, bottom: 0, left: 0 }}
                >
                    <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        interval={0}
                        tickMargin={8}
                        // Every bar keeps its name at phone width; the tooltip and table have it in full.
                        tickFormatter={(label: string) =>
                            label.length > 10 ? `${label.slice(0, 9)}…` : label
                        }
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent />}
                    />
                    <Bar
                        dataKey="value"
                        fill="var(--color-value)"
                        radius={4}
                        maxBarSize={48}
                        isAnimationActive={false}
                    >
                        <LabelList
                            dataKey="value"
                            position="top"
                            formatter={(value: unknown) =>
                                formatValue(Number(value))
                            }
                            className="fill-foreground tabular-nums"
                        />
                    </Bar>
                </BarChart>
            </ChartContainer>
            <ChartDataTable
                caption={title}
                columnHeaders={[entityColumnHeader, valueLabel]}
                rows={entities.map((entity) => ({
                    header: entity.label,
                    values: [formatValue(entity.value)],
                }))}
            />
        </>
    );
}
