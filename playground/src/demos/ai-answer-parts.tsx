import {
    AiAnswerParts,
    AiAnswerSources,
    AiAnswerUsage,
} from '@/components/ai/ai-answer-parts';
import type { AiMessagePart } from '@/lib/ai-message-parts';

const PARTS: AiMessagePart[] = [
    {
        type: 'reasoning',
        id: 'r1',
        text: 'Open invoices: filter by status, newest first.',
        isStreaming: false,
        durationSeconds: 3,
    },
    {
        type: 'tool',
        id: 'call_1',
        name: 'search_items',
        input: { collection: 'invoices', status: 'open' },
        state: 'output-available',
        output: { total: 3 },
        errorText: null,
    },
    {
        type: 'provider-tool',
        id: 'ws_1',
        kind: 'web_search',
        data: { query: 'invoice due date rules Italy' },
    },
    {
        type: 'text',
        text: 'There are 3 open invoices; the oldest is due on 30 September.',
    },
];

/** A whole answer as externa-core renders it; apps pass a Markdown `renderText`. */
export default function AiAnswerPartsDemo() {
    return (
        <div className="flex w-full max-w-lg flex-col gap-3 text-sm">
            <AiAnswerParts parts={PARTS} isStreaming={false} />
            <AiAnswerSources
                sources={[
                    { url: 'https://www.agenziaentrate.gov.it', title: null },
                ]}
            />
            <AiAnswerUsage
                usage={{ input_tokens: 9_200, output_tokens: 410 }}
                maxTokens={128_000}
            />
        </div>
    );
}
