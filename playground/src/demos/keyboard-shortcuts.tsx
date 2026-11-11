import { useState } from 'react';
import {
    ShortcutHint,
    ShortcutsProvider,
    useShortcut,
} from '@/components/keyboard-shortcuts';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

const ISSUES = [
    'TypeError in CheckoutController',
    'Queue worker timed out',
    'Certificate expires in 7 days',
    'Slow query on orders',
];

/**
 * A triage list driven by `j` / `k` / `e`, and `?` for the help dialog. The
 * catalogue renders every demo twice (light and dark), so a panel mounts its
 * provider only while its "Try it" switch is on.
 */
function TriageList() {
    const [activeIndex, setActiveIndex] = useState(0);
    const [resolvedIssues, setResolvedIssues] = useState<string[]>([]);

    useShortcut({
        keys: 'j',
        description: 'Next issue',
        group: 'List',
        handler: () =>
            setActiveIndex((index) => Math.min(index + 1, ISSUES.length - 1)),
    });
    useShortcut({
        keys: 'k',
        description: 'Previous issue',
        group: 'List',
        handler: () => setActiveIndex((index) => Math.max(index - 1, 0)),
    });
    useShortcut({
        keys: 'e',
        description: 'Resolve',
        group: 'List',
        handler: () =>
            setResolvedIssues((resolved) => [...resolved, ISSUES[activeIndex]]),
    });

    return (
        <ul className="grid gap-1 text-sm">
            {ISSUES.map((issue, index) => (
                <li
                    key={issue}
                    aria-current={index === activeIndex || undefined}
                    className={cn(
                        'rounded-md px-2 py-1.5',
                        index === activeIndex && 'bg-accent',
                        resolvedIssues.includes(issue) &&
                            'text-muted-foreground line-through',
                    )}
                >
                    {issue}
                </li>
            ))}
        </ul>
    );
}

export default function KeyboardShortcutsDemo() {
    const [isActive, setIsActive] = useState(false);
    const [canUseSingleKeyShortcuts, setCanUseSingleKeyShortcuts] =
        useState(true);

    return (
        <div className="grid max-w-sm gap-3">
            <div className="flex flex-wrap items-center gap-4 text-sm">
                <label className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    Try it
                </label>
                <label className="flex items-center gap-2">
                    <Switch
                        checked={canUseSingleKeyShortcuts}
                        onCheckedChange={setCanUseSingleKeyShortcuts}
                    />
                    Single-key shortcuts
                </label>
            </div>
            {isActive ? (
                <ShortcutsProvider
                    canUseSingleKeyShortcuts={canUseSingleKeyShortcuts}
                >
                    <TriageList />
                    <Button variant="outline" className="w-fit">
                        Search
                        <ShortcutHint keys="mod+k" />
                    </Button>
                </ShortcutsProvider>
            ) : null}
            <p className="text-xs text-muted-foreground">
                j / k move, e resolves, ? lists the shortcuts.
            </p>
        </div>
    );
}
