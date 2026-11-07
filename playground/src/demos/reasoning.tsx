import {
    Reasoning,
    ReasoningContent,
    ReasoningTrigger,
} from '@/components/ai-elements/reasoning';

export default function ReasoningDemo() {
    return (
        <div className="flex w-full max-w-md flex-col gap-3">
            <Reasoning isStreaming>
                <ReasoningTrigger />
                <ReasoningContent>
                    The user asks for open invoices, so I filter by status…
                </ReasoningContent>
            </Reasoning>
            <Reasoning duration={4}>
                <ReasoningTrigger />
                <ReasoningContent>
                    Three invoices are open; the oldest is from September.
                </ReasoningContent>
            </Reasoning>
        </div>
    );
}
