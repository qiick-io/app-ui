import type { LucideIcon } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/checkbox';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
    /** Title under the preview. */
    name: string;
    isFolder?: boolean;
    /** Icon or thumbnail; a function gets the hover state (video previews). */
    preview: ReactNode | ((isHovered: boolean) => ReactNode);
    /** The preview fills the card and the title sits on a blurred bar. */
    cover?: boolean;
    tags?: string[];
    /** Badge in the top-right corner, e.g. a favourite star. */
    topRight?: ReactNode;
    /** Badge in the bottom-left corner, e.g. "Private". */
    bottomLeft?: ReactNode;
    selected: boolean;
    /** Keeps every checkbox visible while a multi-selection is active. */
    multiSelectMode: boolean;
    isDropTarget?: boolean;
    isTrashed?: boolean;
    actions: FileCardAction[];
    onSelect: (modifiers: FileSelectModifiers) => void;
    /** Double click (and the folder title): open the folder or the details. */
    onOpen: () => void;
    onAction: (key: string) => void;
    /** Before the context menu opens, e.g. to select the card. */
    onPrepareContextMenu?: () => void;
};

/**
 * Single file or folder tile of the files grid (externa-core `file-card.tsx`).
 *
 * Nested interactive pattern: the card surface handles selection / open via
 * click handlers; the title is a separate native `<button>`; the checkbox and
 * the context menu actions are siblings (not nested inside each other) so
 * keyboard and screen-reader users reach each control independently. Drag and
 * drop handlers (`draggable`, `onDragStart`, `onDrop`, …) pass through to the
 * card.
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
    const firstDestructiveIndex = actions.findIndex(
        (action) => action.destructive,
    );
    const previewNode =
        typeof preview === 'function' ? preview(hovered) : preview;

    const titleControl =
        isFolder && !isTrashed ? (
            <button
                type="button"
                data-testid={`file-card-title-${id}`}
                className={cn(
                    'w-full min-w-0 truncate text-center text-xs leading-4 font-medium hover:underline',
                    !cover && 'h-4',
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onOpen();
                }}
            >
                {name}
            </button>
        ) : (
            <button
                type="button"
                data-testid={`file-card-title-${id}`}
                className={cn(
                    'w-full min-w-0 truncate text-center text-xs leading-4 font-medium',
                    !cover && 'h-4',
                )}
                onClick={(event) => {
                    event.stopPropagation();
                    onSelect(event);
                }}
            >
                {name}
            </button>
        );

    const tagsRow =
        tags.length > 0 ? (
            <div
                className="flex w-full min-w-0 items-center justify-center gap-1 overflow-hidden"
                onPointerDown={(event) => event.stopPropagation()}
            >
                <span
                    className={cn(
                        'min-w-0 truncate rounded-md px-2 py-0.5 text-xs font-medium',
                        cover
                            ? 'bg-background/80 text-foreground'
                            : 'bg-muted text-muted-foreground',
                    )}
                >
                    {tags[0]}
                </span>
                {tags.length > 1 && (
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span
                                className={cn(
                                    'inline-flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                                    cover
                                        ? 'bg-background/80 text-foreground'
                                        : 'bg-muted text-muted-foreground',
                                )}
                                aria-label={t('files.tags.moreTags', {
                                    count: tags.length - 1,
                                })}
                            >
                                +{tags.length - 1}
                            </span>
                        </TooltipTrigger>
                        <TooltipContent>
                            {tags.slice(1).join(', ')}
                        </TooltipContent>
                    </Tooltip>
                )}
            </div>
        ) : null;

    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger asChild>
                <div
                    {...props}
                    data-slot="file-card"
                    data-file-id={id}
                    data-testid={`file-card-${id}`}
                    className={cn(
                        'group relative aspect-square w-full min-w-0 overflow-hidden rounded-xl border transition-colors',
                        cover
                            ? 'bg-muted/30'
                            : 'flex flex-col items-center bg-card p-3 hover:bg-muted/40',
                        'border-sidebar-border/70',
                        selected && 'bg-muted/50 ring-2 ring-primary',
                        isDropTarget && 'ring-2 ring-primary',
                        isTrashed && 'opacity-80',
                        className,
                    )}
                    onMouseEnter={() => setHovered(true)}
                    onMouseLeave={() => setHovered(false)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={selected}
                    onContextMenu={() => onPrepareContextMenu?.()}
                    onClick={(event) => {
                        event.stopPropagation();
                        onSelect(event);
                    }}
                    onKeyDown={(event) => {
                        // Nested controls (checkbox, title) handle their own keys.
                        if (
                            event.target !== event.currentTarget ||
                            (event.key !== 'Enter' && event.key !== ' ')
                        ) {
                            return;
                        }

                        event.preventDefault();
                        event.stopPropagation();
                        onSelect(event);
                    }}
                    onDoubleClick={() => {
                        if (!isTrashed) {
                            onOpen();
                        }
                    }}
                >
                    {cover && (
                        <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
                            {previewNode}
                        </div>
                    )}

                    <div
                        className={cn(
                            'absolute top-2 left-2 z-20 transition-opacity',
                            showCheckbox ? 'opacity-100' : 'opacity-0',
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

                    {cover ? (
                        <div className="absolute inset-x-0 bottom-0 z-10 min-w-0 overflow-hidden rounded-b-xl bg-background/65 px-3 py-2 backdrop-blur-md">
                            <div className="flex min-w-0 flex-col items-center gap-1 text-center">
                                {titleControl}
                                {tagsRow}
                            </div>
                        </div>
                    ) : (
                        <div className="flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-2 overflow-hidden">
                            <div className="flex size-12 shrink-0 items-center justify-center">
                                {previewNode}
                            </div>
                            {titleControl}
                            {tagsRow}
                        </div>
                    )}
                </div>
            </ContextMenuTrigger>
            <ContextMenuContent>
                {actions.map((action, index) => {
                    const Icon = action.icon;
                    const showSeparator =
                        firstDestructiveIndex > 0 &&
                        index === firstDestructiveIndex;

                    return (
                        <Fragment key={action.key}>
                            {showSeparator && <ContextMenuSeparator />}
                            <ContextMenuItem
                                variant={
                                    action.destructive
                                        ? 'destructive'
                                        : 'default'
                                }
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
                            </ContextMenuItem>
                        </Fragment>
                    );
                })}
            </ContextMenuContent>
        </ContextMenu>
    );
}
