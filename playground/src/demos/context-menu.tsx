import { Download, Pencil, Trash2 } from 'lucide-react';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';

export default function ContextMenuDemo() {
    return (
        <ContextMenu modal={false}>
            <ContextMenuTrigger className="flex h-24 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                Right-click here
            </ContextMenuTrigger>
            <ContextMenuContent>
                <ContextMenuItem>
                    <Download className="size-4" />
                    Download
                </ContextMenuItem>
                <ContextMenuItem>
                    <Pencil className="size-4" />
                    Rename
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem variant="destructive">
                    <Trash2 className="size-4" />
                    Move to trash
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    );
}
