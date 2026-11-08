import {
    CodeBlock,
    CodeBlockCopyButton,
} from '@/components/ai-elements/code-block';

const CODE = `Route::get('/invoices', [InvoiceController::class, 'index'])
    ->middleware('auth');`;

export default function CodeBlockDemo() {
    return (
        <CodeBlock code={CODE} language="php" className="max-w-lg">
            <CodeBlockCopyButton aria-label="Copy code" />
        </CodeBlock>
    );
}
