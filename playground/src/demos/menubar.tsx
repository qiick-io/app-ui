import {
    Menubar,
    MenubarCheckboxItem,
    MenubarContent,
    MenubarItem,
    MenubarMenu,
    MenubarSeparator,
    MenubarShortcut,
    MenubarSub,
    MenubarSubContent,
    MenubarSubTrigger,
    MenubarTrigger,
} from '@/components/ui/menubar';

/** Desktop-style menu bar: menus, a submenu, a checkbox item and shortcuts. */
export default function MenubarDemo() {
    return (
        <Menubar>
            <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                    <MenubarItem>
                        New item <MenubarShortcut>⌘N</MenubarShortcut>
                    </MenubarItem>
                    <MenubarSub>
                        <MenubarSubTrigger>Export</MenubarSubTrigger>
                        <MenubarSubContent>
                            <MenubarItem>CSV</MenubarItem>
                            <MenubarItem>JSON</MenubarItem>
                        </MenubarSubContent>
                    </MenubarSub>
                    <MenubarSeparator />
                    <MenubarItem variant="destructive">Delete</MenubarItem>
                </MenubarContent>
            </MenubarMenu>
            <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                    <MenubarCheckboxItem checked>
                        Show sidebar
                    </MenubarCheckboxItem>
                    <MenubarCheckboxItem>Compact rows</MenubarCheckboxItem>
                </MenubarContent>
            </MenubarMenu>
        </Menubar>
    );
}
