import { StatCard, trendOf } from '@/components/stat-card';

/**
 * Key numbers as in the shadcn dashboard-01 block (docs/dashboard.md): label, large value,
 * trend badge, headline and muted context.
 */
export default function StatCardDemo() {
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-12">
            <StatCard
                className="xl:col-span-3"
                label="Open findings"
                value="14"
                trend={trendOf(14, 12)}
                headline="11 medium · 3 low"
                context="vs previous 14 days"
            />
            <StatCard
                className="xl:col-span-3"
                label="Projects at risk"
                value="0"
                trend={trendOf(0, 2)}
                headline="Worst finding critical or high"
                context="vs previous 14 days"
            />
            <StatCard
                className="xl:col-span-3"
                label="Requests"
                value="6,631"
                trend={trendOf(6631, 6200)}
                headline="139 server errors (2.1%)"
                context="vs previous 14 days"
            />
            <StatCard
                className="xl:col-span-3"
                label="Not reporting"
                value="1"
                headline="Of 2 projects"
                context="No report within the stale setting"
            />
        </div>
    );
}
