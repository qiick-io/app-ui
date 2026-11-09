import { X } from 'lucide-react';
import { ChatReplyQuote } from '@/components/chat/chat-reply-quote';
import { Button } from '@/components/ui/button';

export default function ChatReplyQuoteDemo() {
    return (
        <div className="flex w-80 flex-col gap-3">
            <ChatReplyQuote
                author="Giulia Ferri"
                body="Can you check the September invoices?"
                onSelect={() => undefined}
            />
            <ChatReplyQuote
                author="Replying to Lars Holm"
                body="The export is ready."
                action={
                    <Button
                        variant="ghost"
                        size="icon-xs"
                        aria-label="Cancel reply"
                    >
                        <X />
                    </Button>
                }
            />
        </div>
    );
}
