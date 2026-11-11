import {
    Activity,
    Bell,
    Bug,
    CalendarClock,
    History,
    LayoutDashboard,
    Package,
    ShieldAlert,
} from 'lucide-react';
import type { ViewTabGroup } from '@/components/grouped-view-tabs';
import { GroupedViewTabs } from '@/components/grouped-view-tabs';

const GROUPS: ViewTabGroup[] = [
    {
        id: 'overview',
        label: 'Overview',
        views: [
            {
                id: 'overview',
                label: 'Overview',
                href: '#',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        id: 'issues',
        label: 'Issues',
        icon: Bug,
        views: [
            {
                id: 'exceptions',
                label: 'Exceptions',
                href: '#',
                icon: Bug,
                count: 12,
                severity: 'critical',
            },
            {
                id: 'findings',
                label: 'Findings',
                href: '#',
                icon: ShieldAlert,
                count: 3,
                severity: 'warning',
            },
        ],
    },
    {
        id: 'health',
        label: 'Health',
        icon: Activity,
        views: [
            { id: 'runtime', label: 'Runtime', href: '#', icon: Activity },
            {
                id: 'schedule',
                label: 'Schedule',
                href: '#',
                icon: CalendarClock,
                count: 1,
                severity: 'warning',
            },
        ],
    },
    {
        id: 'dependencies',
        label: 'Dependencies',
        icon: Package,
        views: [
            { id: 'licenses', label: 'Licenses', href: '#', icon: Package },
        ],
    },
    {
        id: 'alerts',
        label: 'Alerts',
        views: [{ id: 'alerts', label: 'Alerts', href: '#', icon: Bell }],
    },
    {
        id: 'history',
        label: 'History',
        views: [{ id: 'history', label: 'History', href: '#', icon: History }],
    },
];

/** Both variants on one record; links are inert in the playground. */
export default function GroupedViewTabsDemo() {
    return (
        <div className="grid gap-6 text-sm">
            <div className="grid gap-2">
                <p className="text-xs text-muted-foreground">
                    sub-menu, on Exceptions
                </p>
                <GroupedViewTabs
                    groups={GROUPS}
                    activeViewId="exceptions"
                    ariaLabel="Project views"
                    variant="sub-menu"
                />
            </div>
            <div className="grid gap-2">
                <p className="text-xs text-muted-foreground">
                    two-rows, on Schedule
                </p>
                <GroupedViewTabs
                    groups={GROUPS}
                    activeViewId="schedule"
                    ariaLabel="Project views"
                    variant="two-rows"
                />
            </div>
        </div>
    );
}
