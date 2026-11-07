import {
    Source,
    Sources,
    SourcesContent,
    SourcesTrigger,
} from '@/components/ai-elements/sources';

export default function SourcesDemo() {
    return (
        <Sources>
            <SourcesTrigger count={2} />
            <SourcesContent>
                <Source href="https://laravel.com/docs" title="Laravel docs" />
                <Source href="https://ui.shadcn.com" title="shadcn/ui" />
            </SourcesContent>
        </Sources>
    );
}
