import { Badge } from '@/components/ui/badge';

const VARIANTS = [
    'default',
    'secondary',
    'outline',
    'muted',
    'success',
    'warning',
    'info',
    'destructive',
    'ai',
] as const;

export default function BadgeDemo() {
    return (
        <div className="flex flex-wrap gap-2">
            {VARIANTS.map((variant) => (
                <Badge key={variant} variant={variant}>
                    {variant}
                </Badge>
            ))}
        </div>
    );
}
