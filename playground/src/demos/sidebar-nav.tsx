import {
    Database,
    LayoutGrid,
    Settings,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { SidebarNavItem } from '@/components/sidebar-nav';
import {
    SidebarNav,
    SidebarNavSection,
    SidebarNavTree,
} from '@/components/sidebar-nav';
import {
    Sidebar,
    SidebarContent,
    SidebarProvider,
} from '@/components/ui/sidebar';

const PLATFORM_ITEMS: SidebarNavItem[] = [
    { title: 'Dashboard', href: '#/', icon: LayoutGrid },
    {
        title: 'Collections',
        icon: Database,
        items: [
            { title: 'Articles', href: '#/', isActive: true, badge: 12 },
            { title: 'Products', href: '#/' },
            { title: 'Authors', href: '#/' },
        ],
    },
    {
        title: 'Users',
        icon: Users,
        items: [
            { title: 'All users', href: '#/' },
            { title: 'Groups', href: '#/' },
            { title: 'Invitations', href: '#/', badge: 3 },
        ],
    },
    { title: 'Settings', href: '#/', icon: Settings, badge: 1 },
];

const SECURITY_ITEMS: SidebarNavItem[] = [
    { title: 'API keys', href: '#/', icon: ShieldCheck },
    { title: 'Audit log', href: '#/' },
];

const FOLDER_TREE: SidebarNavItem[] = [
    {
        title: 'Marketing',
        items: [
            {
                title: 'Campaigns',
                items: [
                    { title: 'spring-launch.pdf', href: '#/', isActive: true },
                    { title: 'newsletter.md', href: '#/' },
                ],
            },
            { title: 'brand-guide.pdf', href: '#/' },
        ],
    },
    { title: 'Contracts', items: [{ title: 'supplier.pdf', href: '#/' }] },
    { title: 'readme.md', href: '#/' },
];

function DemoSidebar({
    caption,
    isIconOnly = false,
    children,
}: {
    caption: string;
    isIconOnly?: boolean;
    children: React.ReactNode;
}) {
    return (
        <figure className="flex flex-col gap-2">
            <figcaption className="text-sm text-muted-foreground">
                {caption}
            </figcaption>
            {isIconOnly ? (
                // The icon-only sidebar is position: fixed and full height;
                // the transform makes this box its containing block.
                <div className="h-72 w-12 transform-gpu overflow-hidden rounded-md border">
                    <SidebarProvider defaultOpen={false} className="min-h-0">
                        <Sidebar collapsible="icon">
                            <SidebarContent>{children}</SidebarContent>
                        </Sidebar>
                    </SidebarProvider>
                </div>
            ) : (
                <SidebarProvider className="min-h-0 w-auto">
                    <Sidebar
                        collapsible="none"
                        className="relative h-auto rounded-md border"
                    >
                        <SidebarContent>{children}</SidebarContent>
                    </Sidebar>
                </SidebarProvider>
            )}
        </figure>
    );
}

/**
 * The four shapes of nested navigation: collapsible children (the active
 * child opens its parent), always-open children, folding sections with a
 * folder tree, and the icon-only sidebar where children open in a dropdown
 * beside the icon.
 */
export default function SidebarNavDemo() {
    return (
        <div className="flex flex-wrap items-start gap-6">
            <DemoSidebar caption="Collapsible children">
                <SidebarNav label="Platform" items={PLATFORM_ITEMS} />
            </DemoSidebar>
            <DemoSidebar caption="Always-open children">
                <SidebarNav
                    label="Platform"
                    items={PLATFORM_ITEMS}
                    childrenDisplay="open"
                />
            </DemoSidebar>
            <DemoSidebar caption="Sections and folder tree">
                <SidebarNavSection label="Security" items={SECURITY_ITEMS} />
                <SidebarNavTree label="Files" items={FOLDER_TREE} />
            </DemoSidebar>
            <DemoSidebar caption="Icon-only sidebar" isIconOnly>
                <SidebarNav items={PLATFORM_ITEMS} />
            </DemoSidebar>
        </div>
    );
}
