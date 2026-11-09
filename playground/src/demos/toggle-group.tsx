import { Database, Trash2, Users, UsersRound } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/** Segmented controls as on externa-core Users and Chat. */
export default function ToggleGroupDemo() {
    return (
        <div className="flex flex-wrap gap-3">
            <ToggleGroup type="single" variant="outline" defaultValue="active">
                <ToggleGroupItem
                    value="active"
                    aria-label="Active users"
                    className="px-2.5"
                >
                    <Users className="size-4" />
                </ToggleGroupItem>
                <ToggleGroupItem
                    value="trashed"
                    aria-label="Trash"
                    className="px-2.5"
                >
                    <Trash2 className="size-4" />
                </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup
                type="single"
                variant="outline"
                defaultValue="collection"
            >
                <ToggleGroupItem value="collection">
                    <Database className="size-4" />
                    <span>Collections</span>
                </ToggleGroupItem>
                <ToggleGroupItem value="private">
                    <UsersRound className="size-4" />
                    <span>Users</span>
                </ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup type="multiple" variant="outline" spacing={1}>
                <ToggleGroupItem value="unread">Unread</ToggleGroupItem>
                <ToggleGroupItem value="mentions">Mentions</ToggleGroupItem>
            </ToggleGroup>
        </div>
    );
}
