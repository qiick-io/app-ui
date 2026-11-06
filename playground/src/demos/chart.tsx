import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from '@/components/ui/chart';
import type { ChartConfig } from '@/components/ui/chart';

const DATA = [
    { day: 'Mon', count: 12 },
    { day: 'Tue', count: 18 },
    { day: 'Wed', count: 9 },
    { day: 'Thu', count: 22 },
    { day: 'Fri', count: 15 },
];

const CONFIG = {
    count: { label: 'Events', color: 'var(--color-primary)' },
} satisfies ChartConfig;

/** A bar chart in ChartContainer, as the dashboard uses it. */
export default function ChartDemo() {
    return (
        <ChartContainer config={CONFIG} className="h-48 w-full max-w-md">
            <BarChart data={DATA}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="day" tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" fill="var(--color-count)" radius={4} />
            </BarChart>
        </ChartContainer>
    );
}
