import { EllipsisVertical, Tag } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ComponentProps, ComponentType, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/** One entry of a file card's context menu. */
export type FileCardAction = {
    key: string;
    label: string;
    icon: LucideIcon;
    /** Red, after a separator before the first destructive entry. */
    destructive?: boolean;
    /** Disables the entry and explains why under its label. */
    disabledReason?: string;
};

/** Modifier keys of the click or key press that selected a card. */
export type FileSelectModifiers = {
    metaKey?: boolean;
    ctrlKey?: boolean;
    shiftKey?: boolean;
};

type FileCardProps = Omit<
    ComponentProps<'div'>,
    'children' | 'id' | 'onSelect'
> & {
    id: number | string;
    /** Name in the row under the preview (full name in a tooltip). */
    name: string;
    isFolder?: boolean;
    /** Icon or thumbnail; a function gets the hover state (video previews). */
    preview: ReactNode | ((isHovered: boolean) => ReactNode);
    /** The preview fills the area above the name row, edge to edge (images, videos). */
    cover?: boolean;
    /** Shown in a hover card behind the tag button, only when there are any. */
    tags?: string[];
    /** Badge in the top-right corner, e.g. a favourite star. */
    topRight?: ReactNode;
    /** Badge in the bottom-left corner of the preview, e.g. "Private". */
    bottomLeft?: ReactNode;
    selected: boolean;
    /** Keeps every checkbox visible while a multi-selection is active. */
    multiSelectMode: boolean;
    isDropTarget?: boolean;
    isTrashed?: boolean;
    /** Right-click and ⋮ menu entries; none renders the card without menus. */
    actions: FileCardAction[];
    onSelect: (modifiers: FileSelectModifiers) => void;
    /** Double click (and the folder name): open the folder or the details. */
    onOpen: () => void;
    onAction: (key: string) => void;
    /** Before a menu opens, e.g. to select the card. */
    onPrepareContextMenu?: () => void;
};

type MenuItemComponent = ComponentType<{
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    title?: string;
    onSelect?: (event: Event) => void;
    children?: ReactNode;
    'data-testid'?: string;
}>;

/**
 * One rendering of the actions for both the right-click ContextMenu and the ⋮
 * DropdownMenu (externa-core `file-action-menu-items.tsx`), so the two menus
 * always list the same entries in the same order.
 */
function FileActionMenuItems({
    actions,
    onAction,
    item: Item,
    separator: Separator,
}: {
    actions: FileCardAction[];
    onAction: (key: string) => void;
    item: MenuItemComponent;
    separator: ComponentType;
}) {
    const firstDestructiveIndex = actions.findIndex(
        (action) => action.destructive,
    );

    return actions.map((action, index) => {
        const Icon = action.icon;
        const showSeparator =
            firstDestructiveIndex > 0 && index === firstDestructiveIndex;

        return (
            <Fragment key={action.key}>
                {showSeparator && <Separator />}
                <Item
                    variant={action.destructive ? 'destructive' : 'default'}
                    data-testid={`files-context-action-${action.key}`}
                    disabled={Boolean(action.disabledReason)}
                    title={action.disabledReason}
                    onSelect={() => onAction(action.key)}
                >
                    <Icon className="size-4" />
                    {action.disabledReason ? (
                        <span className="flex flex-col">
                            {action.label}
                            <span className="text-xs text-muted-foreground">
                                {action.disabledReason}
                            </span>
                        </span>
                    ) : (
                        action.label
                    )}
                </Item>
            </Fragment>
        );
    });
}

/**
 * Single file or folder tile of the files grid (externa-core `file-card.tsx`,
 * #592 / #596).
 *
 * The whole card is square, files and folders alike: the preview fills the
 * space above a 40px name row. The card surface is a plain container (click
 * selects, double click opens, right-click shows the actions) with no role or
 * tab stop, so no control sits inside another (axe nested-interactive).
 * Keyboard users reach the checkbox, the name button (select a file / open a
 * folder), the tag button and the ⋮ menu. Drag and drop handlers
 * (`draggable`, `onDragStart`, `onDrop`, …) pass through to the card.
 */
export function FileCard({
    id,
    name,
    isFolder = false,
    preview,
    cover = false,
    tags = [],
    topRight,
    bottomLeft,
    selected,
    multiSelectMode,
    isDropTarget = false,
    isTrashed = false,
    actions,
    onSelect,
    onOpen,
    onAction,
    onPrepareContextMenu,
    className,
    ...props
}: FileCardProps) {
    const { t } = useTranslation();
    const [hovered, setHovered] = useState(false);
    const showCheckbox = hovered || selected || multiSelectMode;
    const previewNode =
        typeof preview === 'function' ? preview(hovered) : preview;

    // Menu buttons in the name row prepare the selection like a right-click
    // does, and keep their clicks off the card surface.
    const menuTriggerProps = {
        onPointerDown: () => onPrepareContextMenu?.(),
        onClick: (event: { stopPropagation: () => void }) =>
            event.stopPropagation(),
        onDoubleClick: (event: { stopPropagation: () => void }) =>
            event.stopPropagation(),
    };

    const card = (
        // Pointer shortcuts only: the checkbox and the name button are the
        // keyboard path, so the surface stays a plain container (no nested
        // interactive controls).
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div
            {...props}
            data-slot="file-card"
            data-file-id={id}
            data-testid={`file-card-${id}`}
            data-selected={selected}
            className={cn(
                'group relative flex aspect-square w-full min-w-0 flex-col overflow-hidden rounded-xl border border-sidebar-border/70 bg-card transition-colors hover:bg-muted/40',
                // An inset overlay draws the selection ring above the cover
                // media: an outer ring is cut by the grid's scroll container.
                (selected || isDropTarget) &&
                    'after:pointer-events-none after:absolute after:inset-0 after:z-30 after:rounded-xl after:ring-2 after:ring-primary after:ring-inset',
                selected && 'bg-muted/50',
                isTrashed && 'opacity-80',
                className,
            )}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onContextMenu={() => onPrepareContextMenu?.()}
            onClick={(event) => {
                event.stopPropagation();
                onSelect(event);
            }}
            onDoubleClick={() => {
                if (!isTrashed) {
                    onOpen();
                }
            }}
        >
            <div
                data-testid={`file-card-preview-${id}`}
                className={cn(
                    'relative min-h-0 flex-1 overflow-hidden bg-muted/30',
                    !cover && 'flex items-center justify-center bg-muted',
                )}
            >
                {cover ? (
                    <div className="absolute inset-0">{previewNode}</div>
                ) : (
                    <div className="flex size-1/3 items-center justify-center">
                        {previewNode}
                    </div>
                )}

                <div
                    className={cn(
                        'absolute top-2 left-2 z-20 transition-opacity',
                        showCheckbox
                            ? 'opacity-100'
                            : 'opacity-0 focus-within:opacity-100',
                    )}
                    onPointerDown={(event) => event.stopPropagation()}
                >
                    <Checkbox
                        checked={selected}
                        onClick={(event) => {
                            // Keep the card's select-only click from replacing the multi-selection.
                            event.stopPropagation();

                            if (event.shiftKey) {
                                event.preventDefault();
                                onSelect({ shiftKey: true });
                            }
                        }}
                        onCheckedChange={() => onSelect({ metaKey: true })}
                        aria-label={t('files.card.select', { name })}
                    />
                </div>

                {topRight ? (
                    <div className="absolute top-2 right-2 z-20">
                        {topRight}
                    </div>
                ) : null}

                {bottomLeft ? (
                    <div className="absolute bottom-2 left-2 z-20">
                        {bottomLeft}
                    </div>
                ) : null}
            </div>

            <div
                data-testid={`file-card-header-${id}`}
                className="flex h-10 shrink-0 items-center gap-1 border-t border-sidebar-border/70 pr-1 pl-2.5"
            >
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            type="button"
                            data-testid={`file-card-title-${id}`}
                            className={cn(
                                'block w-full min-w-0 truncate text-left text-sm leading-6 font-medium',
                                isFolder && !isTrashed && 'hover:underline',
                            )}
                            onClick={(event) => {
                                event.stopPropagation();

                                if (isFolder && !isTrashed) {
                                    onOpen();

                                    return;
                                }

                                onSelect(event);
                            }}
                        >
                            {name}
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>{name}</TooltipContent>
                </Tooltip>

                {tags.length > 0 && (
                    // Hover or focus shows the tags; a click neither opens a
                    // menu nor selects the card.
                    <HoverCard openDelay={150} closeDelay={100}>
                        <HoverCardTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="shrink-0 text-muted-foreground"
                                data-testid={`file-tags-${id}`}
                                aria-label={t('files.card.tagsMenu', {
                                    count: tags.length,
                                    name,
                                })}
                                onClick={(event) => event.stopPropagation()}
                                onDoubleClick={(event) =>
                                    event.stopPropagation()
                                }
                            >
                                <Tag />
                            </Button>
                        </HoverCardTrigger>
                        <HoverCardContent
                            align="end"
                            className="w-auto max-w-64 p-2"
                        >
                            <div className="flex flex-wrap gap-1">
                                {tags.map((tag) => (
                                    <Badge
                                        key={tag}
                                        variant="secondary"
                                        className="max-w-full truncate"
                                    >
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </HoverCardContent>
                    </HoverCard>
                )}

                {actions.length > 0 && (
                    <DropdownMenu modal={false}>
                        <DropdownMenuTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon-xs"
                                className="shrink-0 text-muted-foreground"
                                data-testid={`file-card-more-${id}`}
                                aria-label={t('files.card.moreActions', {
                                    name,
                                })}
                                {...menuTriggerProps}
                            >
                                <EllipsisVertical />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <FileActionMenuItems
                                actions={actions}
                                onAction={onAction}
                                item={DropdownMenuItem}
                                separator={DropdownMenuSeparator}
                            />
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );

    if (actions.length === 0) {
        return card;
    }

    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>{card}</ContextMenuTrigger>
            <ContextMenuContent>
                <FileActionMenuItems
                    actions={actions}
                    onAction={onAction}
                    item={ContextMenuItem}
                    separator={ContextMenuSeparator}
                />
            </ContextMenuContent>
        </ContextMenu>
    );
}
