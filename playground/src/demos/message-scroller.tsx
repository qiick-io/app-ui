import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent } from '@/components/ui/message';
import {
    MessageScroller,
    MessageScrollerButton,
    MessageScrollerContent,
    MessageScrollerItem,
    MessageScrollerProvider,
    MessageScrollerViewport,
} from '@/components/ui/message-scroller';

const LINES = Array.from({ length: 12 }, (_, index) => ({
    id: index,
    mine: index % 3 === 0,
    text: `Message ${index + 1}`,
}));

/** Conversation scroller: sticks to the bottom, button to jump back down. */
export default function MessageScrollerDemo() {
    return (
        <div className="h-64 rounded-md border">
            <MessageScrollerProvider>
                <MessageScroller>
                    <MessageScrollerViewport>
                        <MessageScrollerContent className="gap-2 p-3">
                            {LINES.map((line) => (
                                <MessageScrollerItem key={line.id}>
                                    <Message
                                        align={line.mine ? 'end' : 'start'}
                                    >
                                        <MessageContent>
                                            <Bubble>
                                                <BubbleContent>
                                                    {line.text}
                                                </BubbleContent>
                                            </Bubble>
                                        </MessageContent>
                                    </Message>
                                </MessageScrollerItem>
                            ))}
                        </MessageScrollerContent>
                    </MessageScrollerViewport>
                    <MessageScrollerButton />
                </MessageScroller>
            </MessageScrollerProvider>
        </div>
    );
}
