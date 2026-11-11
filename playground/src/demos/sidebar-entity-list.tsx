import { FolderKanban, LayoutGrid } from 'lucide-react';
import { useState } from 'react';
import type { SidebarEntity } from '@/components/sidebar-entity-list';
import {
    PinToggleButton,
    SidebarEntityList,
    SidebarFilterInput,
    SidebarFilterProvider,
    useSidebarFilter,
} from '@/components/sidebar-entity-list';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';

const PINNED: SidebarEntity[] = [
    {
        id: 'billing',
        label: 'Billing API',
        href: '#',
        status: 'good',
        isActive: true,
    },
    { id: 'checkout', label: 'Checkout', href: '#', status: 'critical' },
];

const NEEDS_ATTENTION: SidebarEntity[] = [
    { id: 'checkout', label: 'Checkout', href: '#', status: 'critical' },
    { id: 'mobile', label: 'Mobile backend', href: '#', status: 'warning' },
];

function DashboardItem() {
    const isVisible = useSidebarFilter('Dashboard');

    return isVisible ? (
        <SidebarMenuItem>
            <SidebarMenuButton>
                <LayoutGrid />
                <span>Dashboard</span>
            </SidebarMenuButton>
        </SidebarMenuItem>
    ) : null;
}

/** Static sidebar with the filter field, Pinned and Needs attention under Projects. */
export default function SidebarEntityListDemo() {
    const [isMarketingPinned, setIsMarketingPinned] = useState(false);
    const pinned = isMarketingPinned
        ? [
              ...PINNED,
              {
                  id: 'marketing',
                  label: 'Marketing site',
                  href: '#',
                  status: 'good' as const,
              },
          ]
        : PINNED;

    return (
        <div className="flex flex-wrap items-start gap-6">
            <SidebarProvider className="min-h-0 w-auto">
                <Sidebar collapsible="none" className="rounded-md border">
                    <SidebarContent>
                        <SidebarFilterProvider>
                            <div className="pt-2">
                                <SidebarFilterInput />
                            </div>
                            <SidebarGroup className="px-2 py-2">
                                <SidebarMenu>
                                    <DashboardItem />
                                    <SidebarMenuItem>
                                        <SidebarMenuButton>
                                            <FolderKanban />
                                            <span>Projects</span>
                                        </SidebarMenuButton>
                                        <SidebarEntityList
                                            pinned={pinned}
                                            needsAttention={NEEDS_ATTENTION}
                                            viewAllHref="#"
                                        />
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </SidebarFilterProvider>
                    </SidebarContent>
                </Sidebar>
            </SidebarProvider>
            <div className="flex items-center gap-2 text-sm">
                <PinToggleButton
                    isPinned={isMarketingPinned}
                    onToggle={() =>
                        setIsMarketingPinned((isPinned) => !isPinned)
                    }
                    entityLabel="Marketing site"
                />
                Marketing site
            </div>
        </div>
    );
}
