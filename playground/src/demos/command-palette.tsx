import { FolderKanban, LayoutDashboard, Pin, Settings } from 'lucide-react';
import { useState } from 'react';
import type { CommandPaletteGroup } from '@/components/command-palette';
import {
    CommandPalette,
    CommandPaletteTrigger,
} from '@/components/command-palette';
import { ShortcutsProvider } from '@/components/keyboard-shortcuts';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

const PROJECTS = [
    'Billing API',
    'Checkout',
    'Marketing site',
    'Mobile backend',
];

const LOCAL_GROUPS: CommandPaletteGroup[] = [
    {
        id: 'navigation',
        heading: 'Navigation',
        items: [
            {
                id: 'nav:dashboard',
                label: 'Dashboard',
                icon: LayoutDashboard,
                href: '#dashboard',
            },
            {
                id: 'nav:projects',
                label: 'Projects',
                icon: FolderKanban,
                href: '#projects',
            },
            {
                id: 'nav:settings',
                label: 'Settings',
                icon: Settings,
                href: '#settings',
            },
        ],
    },
    {
        id: 'actions',
        heading: 'Actions',
        items: [
            {
                id: 'action:pin',
                label: 'Pin this project',
                icon: Pin,
                onSelect: () => undefined,
            },
        ],
    },
];

/** A fake server search: projects whose name contains the query, after a delay. */
function searchProjects(
    query: string,
    signal: AbortSignal,
): Promise<CommandPaletteGroup[]> {
    return new Promise((resolve, reject) => {
        const timeout = window.setTimeout(
            () =>
                resolve([
                    {
                        id: 'projects',
                        heading: 'Projects',
                        items: PROJECTS.filter((project) =>
                            project.toLowerCase().includes(query.toLowerCase()),
                        ).map((project) => ({
                            id: `project:${project}`,
                            label: project,
                            description: 'Project',
                            icon: FolderKanban,
                            href: `#project-${project}`,
                            meta: <Badge variant="outline">2 open</Badge>,
                        })),
                    },
                ]),
            300,
        );

        signal.addEventListener('abort', () => {
            window.clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    });
}

/**
 * The catalogue renders every demo twice (light and dark), so a panel mounts
 * the palette (and its ⌘K) only while its "Try it" switch is on.
 */
export default function CommandPaletteDemo() {
    const [isActive, setIsActive] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [lastVisit, setLastVisit] = useState('');

    return (
        <div className="grid max-w-sm gap-3 text-sm">
            <label className="flex items-center gap-2">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                Try it
            </label>
            {isActive ? (
                <ShortcutsProvider>
                    <CommandPaletteTrigger onOpen={() => setIsOpen(true)} />
                    <CommandPalette
                        open={isOpen}
                        onOpenChange={setIsOpen}
                        groups={LOCAL_GROUPS}
                        search={searchProjects}
                        onNavigate={setLastVisit}
                        recentStorageKey="playground.palette.recent"
                    />
                </ShortcutsProvider>
            ) : null}
            <p className="text-xs text-muted-foreground">
                ⌘K / Ctrl+K opens it; type "bill" for a server result.
                {lastVisit ? ` Last visit: ${lastVisit}` : ''}
            </p>
        </div>
    );
}
