import {
    Tool,
    ToolContent,
    ToolHeader,
    ToolInput,
    ToolOutput,
} from '@/components/ai-elements/tool';

export default function ToolDemo() {
    return (
        <div className="flex w-full max-w-md flex-col gap-2">
            <Tool defaultOpen>
                <ToolHeader
                    type="tool-search_items"
                    title="search_items"
                    state="output-available"
                />
                <ToolContent>
                    <ToolInput
                        input={{ collection: 'invoices', status: 'open' }}
                    />
                    <ToolOutput output={{ total: 3 }} />
                </ToolContent>
            </Tool>
            <Tool>
                <ToolHeader
                    type="tool-delete_item"
                    title="delete_item"
                    state="output-error"
                />
                <ToolContent>
                    <ToolInput input={{ id: 42 }} />
                    <ToolOutput output={null} errorText="Item 42 is locked." />
                </ToolContent>
            </Tool>
        </div>
    );
}
