import { Bubble, BubbleContent, BubbleGroup } from '@/components/ui/bubble';

const VARIANTS = [
    'default',
    'secondary',
    'muted',
    'tinted',
    'outline',
    'destructive',
] as const;

export default function BubbleDemo() {
    return (
        <BubbleGroup>
            {VARIANTS.map((variant) => (
                <Bubble key={variant} variant={variant}>
                    <BubbleContent>{variant}</BubbleContent>
                </Bubble>
            ))}
        </BubbleGroup>
    );
}
