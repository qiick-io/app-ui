/**
 * Sidebar navigation with children: the shadcn sidebar blocks for nested menus
 * (ui.shadcn.com/blocks/sidebar, read 2026-11-17), as one set of components on
 * the qiick sidebar.
 *
 * - `SidebarNav`: items with optional children. Children open as a
 *   collapsible submenu (sidebar-07, `childrenDisplay="collapsible"`) or stay
 *   always open (sidebar-03, `childrenDisplay="open"`). In the icon-only
 *   sidebar the children move into a dropdown to the right of the icon
 *   (sidebar-06), so they stay reachable.
 * - `SidebarNavSection`: a group whose label collapses its items (sidebar-02).
 * - `SidebarNavTree`: a folder tree of any depth (sidebar-11).
 *
 * A parent with children is a toggle, never a link: its first child is the
 * landing page. A parent opens by itself when one of its children is active.
 */
import { Link } from '@inertiajs/react';
import { ChevronRight, File, Folder } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    useSidebar,
} from '@/components/ui/sidebar';

/** One navigation entry; `items` turns it into a parent. */
export type SidebarNavItem = {
    title: string;
    /** Required for a leaf; ignored on a parent (a parent only toggles). */
    href?: string;
    icon?: LucideIcon;
    isActive?: boolean;
    /** Count or short label at the end of the row (unread, failing checks). */
    badge?: ReactNode;
    items?: SidebarNavItem[];
};

export type SidebarNavChildrenDisplay = 'collapsible' | 'open';

/** True when the item or any descendant is the current page. */
export function hasActiveSidebarNavItem(
    navigationItem: SidebarNavItem,
): boolean {
    if (navigationItem.isActive) {
        return true;
    }

    return (navigationItem.items ?? []).some(hasActiveSidebarNavItem);
}

function hasChildren(navigationItem: SidebarNavItem): boolean {
    return (navigationItem.items?.length ?? 0) > 0;
}

/**
 * A group of navigation items with an optional label ("Platform"). Leaves are
 * Inertia links; parents show their children by `childrenDisplay`.
 */
export function SidebarNav({
    label,
    items,
    childrenDisplay = 'collapsible',
}: {
    label?: string;
    items: SidebarNavItem[];
    childrenDisplay?: SidebarNavChildrenDisplay;
}) {
    return (
        <SidebarGroup>
            {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
            <SidebarMenu>
                {items.map((navigationItem) => (
                    <SidebarNavEntry
                        key={navigationItem.title}
                        navigationItem={navigationItem}
                        childrenDisplay={childrenDisplay}
                    />
                ))}
            </SidebarMenu>
        </SidebarGroup>
    );
}

function SidebarNavEntry({
    navigationItem,
    childrenDisplay,
}: {
    navigationItem: SidebarNavItem;
    childrenDisplay: SidebarNavChildrenDisplay;
}) {
    const { state, isMobile } = useSidebar();

    if (!hasChildren(navigationItem)) {
        return (
            <SidebarMenuItem>
                <SidebarNavLeafButton navigationItem={navigationItem} />
            </SidebarMenuItem>
        );
    }

    if (state === 'collapsed' && !isMobile) {
        return <SidebarNavFlyout navigationItem={navigationItem} />;
    }

    if (childrenDisplay === 'open') {
        return (
            <SidebarMenuItem>
                {/* A heading, not an action: nothing to toggle or follow. */}
                <SidebarMenuButton
                    asChild
                    className="cursor-default hover:bg-transparent active:bg-transparent"
                >
                    <div>
                        {navigationItem.icon ? <navigationItem.icon /> : null}
                        <span>{navigationItem.title}</span>
                    </div>
                </SidebarMenuButton>
                <SidebarNavChildren items={navigationItem.items ?? []} />
            </SidebarMenuItem>
        );
    }

    return (
        <Collapsible
            asChild
            defaultOpen={hasActiveSidebarNavItem(navigationItem)}
            className="group/collapsible"
        >
            <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={navigationItem.title}>
                        {navigationItem.icon ? <navigationItem.icon /> : null}
                        <span>{navigationItem.title}</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarNavChildren items={navigationItem.items ?? []} />
                </CollapsibleContent>
            </SidebarMenuItem>
        </Collapsible>
    );
}

function SidebarNavLeafButton({
    navigationItem,
}: {
    navigationItem: SidebarNavItem;
}) {
    return (
        <>
            <SidebarMenuButton
                asChild
                isActive={navigationItem.isActive}
                tooltip={navigationItem.title}
            >
                <Link href={navigationItem.href ?? '#'} prefetch>
                    {navigationItem.icon ? <navigationItem.icon /> : null}
                    <span>{navigationItem.title}</span>
                </Link>
            </SidebarMenuButton>
            {navigationItem.badge !== undefined ? (
                <SidebarMenuBadge>{navigationItem.badge}</SidebarMenuBadge>
            ) : null}
        </>
    );
}

/** One level of children under a parent (the sidebar's sub-menu line). */
function SidebarNavChildren({ items }: { items: SidebarNavItem[] }) {
    return (
        <SidebarMenuSub>
            {items.map((childItem) => (
                <SidebarMenuSubItem key={childItem.title}>
                    <SidebarMenuSubButton asChild isActive={childItem.isActive}>
                        <Link href={childItem.href ?? '#'} prefetch>
                            <span>{childItem.title}</span>
                            {childItem.badge !== undefined ? (
                                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                                    {childItem.badge}
                                </span>
                            ) : null}
                        </Link>
                    </SidebarMenuSubButton>
                </SidebarMenuSubItem>
            ))}
        </SidebarMenuSub>
    );
}

/** Icon-only sidebar: the parent's children in a dropdown beside the icon. */
function SidebarNavFlyout({
    navigationItem,
}: {
    navigationItem: SidebarNavItem;
}) {
    return (
        <SidebarMenuItem>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <SidebarMenuButton
                        tooltip={navigationItem.title}
                        isActive={hasActiveSidebarNavItem(navigationItem)}
                        className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                    >
                        {navigationItem.icon ? <navigationItem.icon /> : null}
                        <span>{navigationItem.title}</span>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                    side="right"
                    align="start"
                    className="w-56"
                >
                    <DropdownMenuLabel>
                        {navigationItem.title}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {(navigationItem.items ?? []).map((childItem) => (
                        <DropdownMenuItem key={childItem.title} asChild>
                            <Link
                                href={childItem.href ?? '#'}
                                aria-current={
                                    childItem.isActive ? 'page' : undefined
                                }
                            >
                                {childItem.title}
                            </Link>
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>
        </SidebarMenuItem>
    );
}

/**
 * A sidebar group whose label folds its items away (shadcn sidebar-02), for
 * long navigations split by area. Open by default.
 */
export function SidebarNavSection({
    label,
    items,
    isDefaultOpen = true,
}: {
    label: string;
    items: SidebarNavItem[];
    isDefaultOpen?: boolean;
}) {
    return (
        <Collapsible defaultOpen={isDefaultOpen} className="group/collapsible">
            <SidebarGroup>
                <SidebarGroupLabel
                    asChild
                    className="text-sm text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                >
                    <CollapsibleTrigger>
                        {label}
                        <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((navigationItem) => (
                                <SidebarMenuItem key={navigationItem.title}>
                                    <SidebarNavLeafButton
                                        navigationItem={navigationItem}
                                    />
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </CollapsibleContent>
            </SidebarGroup>
        </Collapsible>
    );
}

/**
 * A folder tree of any depth (shadcn sidebar-11): folders toggle, files are
 * links. Folders on the path to the active file start open.
 */
export function SidebarNavTree({
    label,
    items,
}: {
    label?: string;
    items: SidebarNavItem[];
}) {
    return (
        <SidebarGroup>
            {label ? <SidebarGroupLabel>{label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
                <SidebarMenu>
                    {items.map((treeItem) => (
                        <SidebarNavTreeNode
                            key={treeItem.title}
                            treeItem={treeItem}
                        />
                    ))}
                </SidebarMenu>
            </SidebarGroupContent>
        </SidebarGroup>
    );
}

function SidebarNavTreeNode({ treeItem }: { treeItem: SidebarNavItem }) {
    const TreeLeafIcon = treeItem.icon ?? File;
    const TreeFolderIcon = treeItem.icon ?? Folder;

    if (!hasChildren(treeItem)) {
        return (
            <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={treeItem.isActive}>
                    <Link href={treeItem.href ?? '#'}>
                        <TreeLeafIcon />
                        <span>{treeItem.title}</span>
                    </Link>
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    }

    return (
        <SidebarMenuItem>
            <Collapsible
                defaultOpen={hasActiveSidebarNavItem(treeItem)}
                className="group/collapsible [&[data-state=open]>button>svg:first-child]:rotate-90"
            >
                <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                        <ChevronRight className="transition-transform" />
                        <TreeFolderIcon />
                        <span>{treeItem.title}</span>
                    </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                    <SidebarMenuSub className="mr-0 pr-0">
                        {(treeItem.items ?? []).map((childItem) => (
                            <SidebarNavTreeNode
                                key={childItem.title}
                                treeItem={childItem}
                            />
                        ))}
                    </SidebarMenuSub>
                </CollapsibleContent>
            </Collapsible>
        </SidebarMenuItem>
    );
}
