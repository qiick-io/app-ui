import { MoreHorizontal, Paperclip, Pin, Sparkles } from 'lucide-react';
import { useState } from 'react';
import {
    ChatComposer,
    ChatLayout,
    ChatListItem,
    ChatListSection,
    ChatThread,
} from '@/components/layout/chat-layout';
import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
} from '@/components/ui/empty';
import { Message, MessageContent } from '@/components/ui/message';

type DemoMessage = { id: number; role: 'user' | 'assistant'; content: string };

const CONVERSATIONS = {
    pinned: ['Weekly report summary'],
    today: [
        'Failed jobs on staging',
        'Draft release notes',
        'Translate the FAQ',
    ],
};

const FIRST_MESSAGES: DemoMessage[] = [
    { id: 1, role: 'user', content: 'How many jobs failed on staging today?' },
    {
        id: 2,
        role: 'assistant',
        content:
            'Three jobs failed on staging today, all in the nightly import. The last error is a timeout while reading the remote feed.',
    },
];

/**
 * Assistant-style chat page body: sectioned conversation list, thread with
 * user and assistant bubbles, and the composer.
 */
export function ChatThreadDemo() {
    const [selected, setSelected] = useState('Failed jobs on staging');
    const [messages, setMessages] = useState(FIRST_MESSAGES);
    const [draft, setDraft] = useState('');

    const send = () => {
        setMessages((current) => [
            ...current,
            { id: current.length + 1, role: 'user', content: draft.trim() },
        ]);
        setDraft('');
    };

    return (
        <ChatLayout
            listLabel="Conversations"
            list={Object.entries(CONVERSATIONS).map(([section, titles]) => (
                <ChatListSection
                    key={section}
                    label={section === 'pinned' ? 'Pinned' : 'Today'}
                    icon={
                        section === 'pinned' ? (
                            <Pin className="size-3 fill-current" />
                        ) : null
                    }
                >
                    {titles.map((title) => (
                        <ChatListItem
                            key={title}
                            isSelected={title === selected}
                            onSelect={() => setSelected(title)}
                        >
                            <span className="min-w-0 flex-1 truncate">
                                {title}
                            </span>
                            <MoreHorizontal className="size-4 text-muted-foreground" />
                        </ChatListItem>
                    ))}
                </ChatListSection>
            ))}
        >
            <ChatThread
                composer={
                    <ChatComposer
                        value={draft}
                        onChange={setDraft}
                        onSubmit={send}
                        label="Message"
                        sendLabel="Send"
                        placeholder="Ask anything…"
                        actions={
                            <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="text-muted-foreground"
                                aria-label="Attach"
                            >
                                <Paperclip className="size-4" />
                            </Button>
                        }
                    />
                }
            >
                {messages.length === 0 ? (
                    <Empty className="m-auto">
                        <EmptyHeader>
                            <EmptyMedia
                                variant="icon"
                                className="bg-ai/10 text-ai"
                            >
                                <Sparkles />
                            </EmptyMedia>
                            <EmptyDescription>
                                Ask about your project.
                            </EmptyDescription>
                        </EmptyHeader>
                    </Empty>
                ) : (
                    messages.map((message) => {
                        const isUser = message.role === 'user';

                        return (
                            <Message
                                key={message.id}
                                align={isUser ? 'end' : 'start'}
                            >
                                <MessageContent>
                                    <Bubble
                                        variant={isUser ? 'muted' : 'ghost'}
                                        align={isUser ? 'end' : 'start'}
                                    >
                                        <BubbleContent
                                            className={
                                                isUser
                                                    ? 'text-foreground'
                                                    : 'w-full max-w-full'
                                            }
                                        >
                                            {message.content}
                                        </BubbleContent>
                                    </Bubble>
                                </MessageContent>
                            </Message>
                        );
                    })
                )}
            </ChatThread>
        </ChatLayout>
    );
}
