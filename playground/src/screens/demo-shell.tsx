import {
    BookOpen,
    ChevronsUpDown,
    Database,
    Folder,
    FolderGit2,
    LayoutGrid,
    MessageCircle,
    ScrollText,
    Settings,
    Sparkles,
    Users,
    UsersRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { AppContent } from '@/components/app-content';
import { AppShell } from '@/components/app-shell';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { BreadcrumbItemType } from '@/components/breadcrumbs';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarHeader,
} from '@/components/ui/sidebar';

export type ScreenName = 'users' | 'settings' | 'assistant' | 'chat';

type NavEntry = {
    title: string;
    icon: LucideIcon;
    screen?: ScreenName;
};

const PLATFORM: NavEntry[] = [
    { title: 'Dashboard', icon: LayoutGrid },
    { title: 'Files', icon: Folder },
    { title: 'Collections', icon: Database },
    { title: 'Chat', icon: MessageCircle, screen: 'chat' },
    { title: 'Activity Log', icon: ScrollText },
    { title: 'Users', icon: Users, screen: 'users' },
    { title: 'Groups', icon: UsersRound },
    { title: 'Settings', icon: Settings, screen: 'settings' },
];

const FOOTER: NavEntry[] = [
    { title: 'Repository', icon: FolderGit2 },
    { title: 'Documentation', icon: BookOpen },
];

function NavLink({ entry, active }: { entry: NavEntry; active: ScreenName }) {
    return (
        <SidebarMenuButton
            asChild
            isActive={entry.screen === active}
            tooltip={{ children: entry.title }}
        >
            <a href={entry.screen ? `#/${entry.screen}` : '#/'}>
                <entry.icon />
                <span>{entry.title}</span>
            </a>
        </SidebarMenuButton>
    );
}

/**
 * The externa-core 1.4.0 sidebar layout (`app-sidebar-layout.tsx` +
 * `app-sidebar.tsx`), built from the registry's app-shell and sidebar, with
 * placeholder navigation.
 */
export function DemoShell({
    active,
    breadcrumbs,
    headerActions,
    children,
}: {
    active: ScreenName;
    breadcrumbs: BreadcrumbItemType[];
    headerActions?: ReactNode;
    children: ReactNode;
}) {
    return (
        <AppShell variant="sidebar">
            <Sidebar collapsible="icon" variant="inset">
                <nav
                    aria-label="Main navigation"
                    className="flex h-full w-full flex-col"
                >
                    <SidebarHeader>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton size="lg" asChild>
                                    <a href="#/">
                                        <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
                                            q
                                        </div>
                                        <div className="ml-1 grid flex-1 text-left text-sm">
                                            <span className="mb-0.5 truncate leading-tight font-semibold">
                                                qiick app
                                            </span>
                                        </div>
                                    </a>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarHeader>
                    <SidebarContent>
                        <SidebarGroup className="px-2 py-0">
                            <SidebarMenu>
                                <SidebarMenuItem>
                                    <SidebarMenuButton
                                        asChild
                                        isActive={active === 'assistant'}
                                        tooltip={{ children: 'Assistant' }}
                                        className="sidebar-ai-nav"
                                    >
                                        <a href="#/assistant">
                                            <Sparkles />
                                            <span>Assistant</span>
                                            {active !== 'assistant' ? (
                                                <kbd className="ml-auto font-sans text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">
                                                    ⌘J
                                                </kbd>
                                            ) : null}
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            </SidebarMenu>
                        </SidebarGroup>
                        <SidebarGroup className="px-2 py-0">
                            <SidebarGroupLabel>Platform</SidebarGroupLabel>
                            <SidebarMenu>
                                {PLATFORM.map((entry) => (
                                    <SidebarMenuItem key={entry.title}>
                                        <NavLink
                                            entry={entry}
                                            active={active}
                                        />
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                    </SidebarContent>
                    <SidebarFooter>
                        <SidebarGroup className="mt-auto px-0 group-data-[collapsible=icon]:p-0">
                            <SidebarMenu>
                                {FOOTER.map((entry) => (
                                    <SidebarMenuItem key={entry.title}>
                                        <NavLink
                                            entry={entry}
                                            active={active}
                                        />
                                    </SidebarMenuItem>
                                ))}
                            </SidebarMenu>
                        </SidebarGroup>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    size="lg"
                                    className="text-sidebar-accent-foreground"
                                >
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                        EM
                                    </span>
                                    <span className="grid flex-1 text-left text-sm leading-tight">
                                        <span className="truncate font-medium">
                                            Elena Marchetti
                                        </span>
                                    </span>
                                    <ChevronsUpDown className="ml-auto size-4" />
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarFooter>
                </nav>
            </Sidebar>
            <AppContent
                variant="sidebar"
                id="main-content"
                className="overflow-hidden"
                tabIndex={-1}
            >
                <AppSidebarHeader
                    breadcrumbs={breadcrumbs}
                    actions={headerActions}
                />
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    {children}
                </div>
            </AppContent>
        </AppShell>
    );
}
