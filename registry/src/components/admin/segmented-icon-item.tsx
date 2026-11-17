import type { ReactNode } from 'react';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

/**
 * One icon item of a segmented control (`ToggleGroup type="single" variant="outline"`), as in
 * Users active / trash: the icon only, its name in a tooltip and as the accessible name,
 * so a row of filters stays compact at every width. Segments without an icon keep their text.
 *
 * The tooltip trigger would otherwise stamp its own `data-state` (closed / delayed-open) over the
 * toggle's `on` / `off`, which drives the selected style; the item passes it explicitly, and the
 * child's props win when Radix merges them.
 *
 * @param props.value - The segment's value in the toggle group.
 * @param props.label - Its name: tooltip text and `aria-label`.
 * @param props.isActive - Whether this segment is the group's current value.
 * @param props.children - The lucide icon.
 */
export function SegmentedIconItem({
    value,
    label,
    isActive,
    children,
}: {
    value: string;
    label: string;
    isActive: boolean;
    children: ReactNode;
}) {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <ToggleGroupItem
                    value={value}
                    aria-label={label}
                    data-state={isActive ? 'on' : 'off'}
                >
                    {children}
                </ToggleGroupItem>
            </TooltipTrigger>
            <TooltipContent side="bottom">{label}</TooltipContent>
        </Tooltip>
    );
}
