import {
    Download,
    FolderInput,
    Pencil,
    Share2,
    Star,
    Trash2,
} from 'lucide-react';
import { ActionsOverflow } from '@/components/admin/actions-overflow';
import type { OverflowActionDefinition } from '@/components/admin/actions-overflow';

const ACTIONS: OverflowActionDefinition[] = [
    { key: 'download', label: 'Download', icon: Download },
    { key: 'move', label: 'Move', icon: FolderInput },
    { key: 'rename', label: 'Rename', icon: Pencil },
    { key: 'share', label: 'Share', icon: Share2 },
    { key: 'favorite', label: 'Add to favourites', icon: Star },
    { key: 'trash', label: 'Move to trash', icon: Trash2, destructive: true },
];

/** Resize the window: actions spill into ⋯ only when they no longer fit. */
export default function ActionsOverflowDemo() {
    return (
        <div className="flex flex-col gap-3">
            <div className="w-full max-w-md resize-x overflow-hidden rounded-md border p-2">
                <ActionsOverflow
                    actions={ACTIONS}
                    onAction={(key) => console.info('action', key)}
                />
            </div>
            <div className="w-48 rounded-md border p-2">
                <ActionsOverflow
                    actions={ACTIONS}
                    iconOnly
                    onAction={(key) => console.info('action', key)}
                />
            </div>
        </div>
    );
}
