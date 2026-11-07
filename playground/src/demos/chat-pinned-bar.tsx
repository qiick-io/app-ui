import { ChatPinnedBar } from '@/components/chat/chat-pinned-bar';

export default function ChatPinnedBarDemo() {
    return (
        <div className="w-80">
            <ChatPinnedBar
                rows={[
                    {
                        id: 1,
                        author: 'Giulia Ferri',
                        body: 'Deadline: Friday 12:00',
                    },
                    { id: 2, author: 'Lars Holm', body: 'Brief in Files › Q4' },
                ]}
                onSelect={() => undefined}
            />
        </div>
    );
}
