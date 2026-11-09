import {
    Archive,
    ArrowUp,
    Database,
    MessageSquare,
    Paperclip,
    Plus,
    Smile,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { HeaderIconButton } from '@/components/admin/header-icon-button';
import { ChatLayout, ChatListItem } from '@/components/layout/chat-layout';
import { FilterSearch } from '@/components/layout/page-header';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import {
    Empty,
    EmptyDescription,
    EmptyHeader,
    EmptyMedia,
} from '@/components/ui/empty';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
    composerFrameClass,
    composerTextareaClass,
    composerToolbarClass,
} from '@/lib/composer-chrome';
import { DemoShell } from './demo-shell';

const THREADS = [
    {
        title: 'Blog posts',
        preview: 'Giulia: the draft is ready',
        time: '10:42',
        unread: 2,
    },
    {
        title: 'Products',
        preview: 'Lars: price updated',
        time: '09:15',
        unread: 0,
    },
    {
        title: 'Landing page',
        preview: 'Elena: new hero image',
        time: '3 Nov',
        unread: 0,
    },
];

/** externa-core `/chat` (pages/chat/index.tsx), no thread picked. */
export function ChatScreen() {
    const [query, setQuery] = useState('');
    const [tab, setTab] = useState('collection');

    return (
        <DemoShell
            active="chat"
            breadcrumbs={[{ title: 'Chat', href: '#/chat' }]}
            headerActions={
                <Button type="button">
                    <Plus className="size-4" />
                    New chat
                </Button>
            }
        >
            <PageLayout
                filters={
                    <FilterSearch
                        className="w-64 flex-none sm:max-w-none lg:w-80"
                        value={query}
                        placeholder="Search chats…"
                        onChange={setQuery}
                    />
                }
                filtersRight={
                    <>
                        <ToggleGroup
                            type="single"
                            variant="outline"
                            value={tab}
                            onValueChange={(value) => value && setTab(value)}
                        >
                            <ToggleGroupItem value="collection">
                                <Database className="size-4" />
                                <span>Collections</span>
                                <span className="min-w-5 rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
                                    2
                                </span>
                            </ToggleGroupItem>
                            <ToggleGroupItem value="private">
                                <UsersRound className="size-4" />
                                <span>Users</span>
                            </ToggleGroupItem>
                        </ToggleGroup>
                        <HeaderIconButton
                            type="button"
                            variant="outline"
                            disabled={tab !== 'private'}
                            label="Show archived"
                        >
                            <Archive className="size-4" />
                        </HeaderIconButton>
                    </>
                }
            >
                <ChatLayout
                    listLabel="Chat threads"
                    list={THREADS.map((thread) => (
                        <ChatListItem
                            key={thread.title}
                            onSelect={() => undefined}
                        >
                            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                                {thread.title.slice(0, 2)}
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">
                                    {thread.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                                    {thread.preview}
                                </span>
                            </span>
                            <span className="flex flex-col items-end gap-1 self-start pt-0.5">
                                <span className="text-xs text-muted-foreground">
                                    {thread.time}
                                </span>
                                {thread.unread > 0 ? (
                                    <span className="flex min-w-5 items-center justify-center rounded-full bg-primary px-2 text-xs font-medium text-primary-foreground">
                                        {thread.unread}
                                    </span>
                                ) : null}
                            </span>
                        </ChatListItem>
                    ))}
                >
                    <div className="absolute inset-0 flex flex-col bg-background">
                        <Empty className="min-h-0 flex-1">
                            <EmptyHeader>
                                <EmptyMedia
                                    variant="icon"
                                    className="bg-primary/10 text-primary"
                                >
                                    <MessageSquare />
                                </EmptyMedia>
                                <EmptyDescription>
                                    Pick a chat to read it.
                                </EmptyDescription>
                            </EmptyHeader>
                        </Empty>
                        <div className="p-3">
                            <div className={composerFrameClass}>
                                <textarea
                                    rows={1}
                                    disabled
                                    className={composerTextareaClass}
                                    style={{ minHeight: 40 }}
                                    placeholder="Write a message…"
                                    aria-label="Write a message…"
                                />
                                <div className={composerToolbarClass}>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled
                                            aria-label="Emoji"
                                        >
                                            <Smile className="size-4" />
                                        </Button>
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="ghost"
                                            disabled
                                            aria-label="Attach"
                                        >
                                            <Paperclip className="size-4" />
                                        </Button>
                                    </div>
                                    <Button
                                        type="button"
                                        size="icon"
                                        className="rounded-full"
                                        disabled
                                        aria-label="Send"
                                    >
                                        <ArrowUp className="size-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </ChatLayout>
            </PageLayout>
        </DemoShell>
    );
}
