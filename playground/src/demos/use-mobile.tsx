import { useIsMobile } from '@/hooks/use-mobile';

export default function UseMobileDemo() {
    const isMobile = useIsMobile();

    return (
        <p className="font-mono text-sm">useIsMobile() → {String(isMobile)}</p>
    );
}
