import {
    addToolCall,
    appendReasoning,
    appendText,
    applyToolResult,
    closeReasoning,
} from '@/lib/ai-message-parts';
import type { AiMessagePart } from '@/lib/ai-message-parts';

/** The reducers fold stream events into parts; this shows the result of one turn. */
export default function AiMessagePartsDemo() {
    let parts: AiMessagePart[] = [];
    parts = appendReasoning(
        parts,
        'r1',
        'The user wants the open invoices.',
        0,
    );
    parts = closeReasoning(parts, 3000);
    parts = addToolCall(
        parts,
        {
            id: 'call_1',
            name: 'search_items',
            input: { collection: 'invoices', status: 'open' },
        },
        3000,
    );
    parts = applyToolResult(parts, {
        id: 'call_1',
        name: 'search_items',
        output: { total: 3 },
        successful: true,
        error: null,
        denied: false,
    });
    parts = appendText(parts, 'There are 3 open invoices.', 4000);

    return (
        <pre className="max-h-64 overflow-auto rounded-md bg-muted p-3 text-xs">
            {JSON.stringify(parts, null, 2)}
        </pre>
    );
}
