import { ChatThreadDemo } from '../screens/chat-thread-demo';

/** The full page is on the Assistant and Chat screens. */
export default function ChatLayoutDemo() {
    return (
        <div className="flex h-96 flex-col overflow-hidden rounded-md border">
            <ChatThreadDemo />
        </div>
    );
}
