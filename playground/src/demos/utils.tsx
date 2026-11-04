import { cn } from '@/lib/utils';

const merged = cn('h-control px-3', 'h-8');

export default function UtilsDemo() {
    return (
        <p className="font-mono text-sm">
            cn('h-control px-3', 'h-8') → "{merged}"
        </p>
    );
}
