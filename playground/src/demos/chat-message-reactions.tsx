import { useState } from 'react';
import { ChatMessageReactions } from '@/components/chat/chat-message-reactions';
import type { ChatReaction } from '@/components/chat/chat-message-reactions';
import { Bubble, BubbleContent } from '@/components/ui/bubble';

export default function ChatMessageReactionsDemo() {
    const [reactions, setReactions] = useState<ChatReaction[]>([
        {
            emoji: '👍',
            count: 2,
            reacted: true,
            users: [{ name: 'You' }, { name: 'Giulia Ferri' }],
        },
        {
            emoji: '🎉',
            count: 1,
            reacted: false,
            users: [{ name: 'Lars Holm' }],
        },
    ]);

    const toggle = (emoji: string) =>
        setReactions((current) =>
            current.map((reaction) =>
                reaction.emoji === emoji
                    ? {
                          ...reaction,
                          reacted: !reaction.reacted,
                          count: reaction.count + (reaction.reacted ? -1 : 1),
                      }
                    : reaction,
            ),
        );

    return (
        <Bubble>
            <BubbleContent>The September invoices are all sent.</BubbleContent>
            <ChatMessageReactions
                reactions={reactions}
                align="start"
                onToggle={toggle}
            />
        </Bubble>
    );
}
