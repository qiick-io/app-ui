import { Separator } from '@/components/ui/separator';

export default function SeparatorDemo() {
    return (
        <div className="flex h-5 items-center gap-3 text-sm">
            Profile
            <Separator orientation="vertical" />
            Security
            <Separator orientation="vertical" />
            Appearance
        </div>
    );
}
