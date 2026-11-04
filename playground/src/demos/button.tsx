import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VARIANTS = [
    'default',
    'secondary',
    'outline',
    'ghost',
    'link',
    'destructive',
    'destructive-outline',
    'destructive-ghost',
] as const;

export default function ButtonDemo() {
    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center gap-2">
                {VARIANTS.map((variant) => (
                    <Button key={variant} variant={variant}>
                        {variant}
                    </Button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm">Small</Button>
                <Button>
                    <Plus />
                    Default
                </Button>
                <Button size="lg">Large</Button>
                <Button size="icon-sm" variant="ghost" aria-label="Delete">
                    <Trash2 />
                </Button>
                <Button size="icon" variant="outline" aria-label="Delete">
                    <Trash2 />
                </Button>
                <Button size="icon-lg" variant="outline" aria-label="Delete">
                    <Trash2 />
                </Button>
                <Button disabled>Disabled</Button>
            </div>
        </div>
    );
}
