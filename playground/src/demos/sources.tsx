import { Sources } from '@/components/ai-elements/sources';
import { Trace } from '@/components/ui/trace';

export default function SourcesDemo() {
    return (
        <Trace className="max-w-md">
            <Sources
                sources={[
                    { url: 'https://ui.shadcn.com/docs', title: 'shadcn/ui' },
                    { url: 'https://laravel.com/docs', title: null },
                ]}
            />
        </Trace>
    );
}
