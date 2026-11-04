import { Bubble, BubbleContent } from '@/components/ui/bubble';
import { Message, MessageContent } from '@/components/ui/message';

export default function MessageDemo() {
    return (
        <div className="flex flex-col gap-4">
            <Message align="end">
                <MessageContent>
                    <Bubble variant="muted" align="end">
                        <BubbleContent>
                            How many reports failed today?
                        </BubbleContent>
                    </Bubble>
                </MessageContent>
            </Message>
            <Message>
                <MessageContent>
                    <Bubble variant="ghost">
                        <BubbleContent className="w-full max-w-full">
                            Two reports failed, both on the staging project.
                        </BubbleContent>
                    </Bubble>
                </MessageContent>
            </Message>
        </div>
    );
}
