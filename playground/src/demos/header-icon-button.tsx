import { Archive, Trash2 } from 'lucide-react';
import { HeaderIconButton } from '@/components/admin/header-icon-button';

export default function HeaderIconButtonDemo() {
    return (
        <div className="flex gap-2">
            <HeaderIconButton label="Show archived" variant="outline">
                <Archive className="size-4" />
            </HeaderIconButton>
            <HeaderIconButton label="Delete selected chats" variant="outline">
                <Trash2 className="size-4" />
            </HeaderIconButton>
        </div>
    );
}
