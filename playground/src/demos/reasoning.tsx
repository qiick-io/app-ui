import { Reasoning } from '@/components/ai-elements/reasoning';
import { Trace } from '@/components/ui/trace';

export default function ReasoningDemo() {
    return (
        <Trace className="max-w-md">
            <Reasoning isStreaming />
            <Reasoning duration={4}>
                The user wants open invoices: filter by status, newest first.
            </Reasoning>
        </Trace>
    );
}
