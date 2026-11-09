import { Tool } from '@/components/ai-elements/tool';
import { Trace } from '@/components/ui/trace';

export default function ToolDemo() {
    return (
        <Trace className="max-w-md">
            <Tool title="Listed the collections" state="output-available" />
            <Tool title="Creating the item" state="input-available" />
            <Tool
                title="Could not delete the item"
                description="Invoice 42"
                state="output-error"
                errorText="The item is locked by another editor."
            />
            <Tool title="Denied deleting the folder" state="output-denied" />
        </Trace>
    );
}
