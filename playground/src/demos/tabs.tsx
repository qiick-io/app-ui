import { Bug, Gauge, History, LayoutGrid, ListChecks } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

const VIEWS = [
    { value: 'overview', label: 'Overview', icon: LayoutGrid },
    { value: 'findings', label: 'Findings', icon: ListChecks },
    { value: 'runtime', label: 'Runtime', icon: Gauge },
    { value: 'exceptions', label: 'Exceptions', icon: Bug },
    { value: 'history', label: 'History', icon: History },
];

/**
 * Views of one record as line tabs under the header, as the Excubia project page. In an app
 * each trigger is a link (`asChild`) to the view's own URL.
 */
export default function TabsDemo() {
    return (
        <Tabs
            defaultValue="overview"
            activationMode="manual"
            className="overflow-x-auto border-b"
        >
            <TabsList variant="line" aria-label="Project views">
                {VIEWS.map(({ value, label, icon: Icon }) => (
                    <TabsTrigger key={value} value={value}>
                        <Icon />
                        {label}
                    </TabsTrigger>
                ))}
            </TabsList>
        </Tabs>
    );
}
