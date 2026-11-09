import { ChainOfThought } from '@/components/ai-elements/chain-of-thought';
import { Tool } from '@/components/ai-elements/tool';
import { Trace } from '@/components/ui/trace';

export default function ChainOfThoughtDemo() {
    return (
        <Trace className="max-w-md">
            <ChainOfThought title="Done in 2 steps" defaultOpen>
                <Tool title="Listed the collections" state="output-available" />
                <Tool title="Read the field types" state="output-available" />
            </ChainOfThought>
        </Trace>
    );
}
