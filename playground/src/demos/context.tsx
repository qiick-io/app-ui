import {
    Context,
    ContextCacheUsage,
    ContextContent,
    ContextContentBody,
    ContextContentHeader,
    ContextInputUsage,
    ContextOutputUsage,
    ContextReasoningUsage,
    ContextTrigger,
} from '@/components/ai-elements/context';

const USAGE = {
    input_tokens: 18_400,
    output_tokens: 1_250,
    reasoning_tokens: 640,
    cache_read_input_tokens: 12_000,
};

export default function ContextDemo() {
    return (
        <Context usedTokens={19_650} maxTokens={128_000} usage={USAGE}>
            <ContextTrigger size="sm" className="text-xs" />
            <ContextContent align="start">
                <ContextContentHeader />
                <ContextContentBody>
                    <ContextInputUsage />
                    <ContextOutputUsage />
                    <ContextReasoningUsage />
                    <ContextCacheUsage />
                </ContextContentBody>
            </ContextContent>
        </Context>
    );
}
