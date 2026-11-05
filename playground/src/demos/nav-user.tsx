import {
    Sidebar,
    SidebarFooter,
    SidebarProvider,
} from '@/components/ui/sidebar';
import { DemoUserMenu } from '../screens/demo-user-menu';

/** Static sidebar footer; the full shell is on the screens. */
export default function NavUserDemo() {
    return (
        <SidebarProvider className="min-h-0">
            <Sidebar collapsible="none" className="rounded-md border">
                <SidebarFooter>
                    <DemoUserMenu />
                </SidebarFooter>
            </Sidebar>
        </SidebarProvider>
    );
}
