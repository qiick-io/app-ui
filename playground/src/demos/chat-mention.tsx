import { ChatMention } from '@/components/chat/chat-mention';

export default function ChatMentionDemo() {
    return (
        <p className="text-sm">
            Thanks{' '}
            <ChatMention
                user={{ id: 2, name: 'Giulia Ferri', role: 'Editor' }}
                isOnline
            />
            , can <ChatMention fallbackLabel="@user 41" /> check the totals?
        </p>
    );
}
