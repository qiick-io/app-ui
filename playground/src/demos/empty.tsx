import { MessagesSquare } from 'lucide-react';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
    EmptyTitle,
} from '@/components/ui/empty';

export default function EmptyDemo() {
    return (
        <Empty className="border border-dashed">
            <EmptyHeader>
                <EmptyMedia
                    variant="icon"
                    className="bg-primary/10 text-primary"
                >
                    <MessagesSquare />
                </EmptyMedia>
                <EmptyTitle>No conversations</EmptyTitle>
                <EmptyDescription>
                    Start one from the Assistant.
                </EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
