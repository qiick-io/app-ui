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

const PROJECTS: SidebarEntity[] = [
    {
        id: 'billing',
        label: 'Billing API',
        href: '#',
        status: 'good',
        isActive: true,
    },
    { id: 'checkout', label: 'Checkout', href: '#', status: 'critical' },
    { id: 'mobile', label: 'Mobile backend', href: '#', status: 'warning' },
    { id: 'marketing', label: 'Marketing site', href: '#', status: 'good' },
];

/** Worst first, as the app's shared prop would rank them. */
const NEEDS_ATTENTION_IDS = ['checkout', 'mobile'];

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

/**
 * Static sidebar with the filter field, Pinned and Needs attention under
 * Projects, and the pin action on every row. Keyboard path: Tab from a
 * record reaches its star, Enter (or Space) toggles it, and focus follows
 * the row into its new block. Shift+F10 on a record opens its menu.
 */
export default function SidebarEntityListDemo() {
    const [pinnedIds, setPinnedIds] = useState(['billing', 'checkout']);
    const pinned = pinnedIds.flatMap((pinnedId) =>
        PROJECTS.filter((project) => project.id === pinnedId),
    );
    const needsAttention = NEEDS_ATTENTION_IDS.flatMap((attentionId) =>
        PROJECTS.filter((project) => project.id === attentionId),
    );
    // The app posts the change and reloads the shared prop; here the toggle
    // lands after a short delay, so focus handling sees the same remount.
    const togglePin = (entity: SidebarEntity) =>
        window.setTimeout(
            () =>
                setPinnedIds((currentIds) =>
                    currentIds.includes(entity.id)
                        ? currentIds.filter(
                              (pinnedId) => pinnedId !== entity.id,
                          )
                        : [...currentIds, entity.id],
                ),
            150,
        );
    const marketingSite = PROJECTS[3];
    const isMarketingPinned = pinnedIds.includes(marketingSite.id);

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
                                            needsAttention={needsAttention}
                                            viewAllHref="#"
                                            onTogglePin={togglePin}
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
                    onToggle={() => togglePin(marketingSite)}
                    entityLabel={marketingSite.label}
                />
                {marketingSite.label}
            </div>
        </div>
    );
}
