import { Kbd, KbdGroup } from '@/components/ui/kbd';

/** Keyboard shortcuts. */
export default function KbdDemo() {
    return (
        <p className="text-sm text-muted-foreground">
            Open the Assistant with{' '}
            <KbdGroup>
                <Kbd>⌘</Kbd>
                <Kbd>J</Kbd>
            </KbdGroup>
        </p>
    );
}
