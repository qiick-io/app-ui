import { Database, LayoutGrid, Sparkles, Users } from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';

/** Static (`collapsible="none"`) so it fits the panel; the full shell is on the screens. */
export default function SidebarDemo() {
    return (
        <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="rounded-md border">
                <SidebarContent>
                    <SidebarGroup className="px-2 py-2">
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton className="sidebar-ai-nav">
                                    <Sparkles />
                                    <span>Assistant</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                    <SidebarGroup className="px-2 py-0">
                        <SidebarGroupLabel>Platform</SidebarGroupLabel>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton>
                                    <LayoutGrid />
                                    <span>Dashboard</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton isActive>
                                    <Users />
                                    <span>Users</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                            <SidebarMenuItem>
                                <SidebarMenuButton>
                                    <Database />
                                    <span>Collections</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroup>
                </SidebarContent>
            </Sidebar>
        </SidebarProvider>
    );
}
