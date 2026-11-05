import { useEffect, useId, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from '@/lib/toast';

/**
 * The two toast channels: a success message (top-centre) and the notifications (top-right,
 * below the header). The catalogue renders each demo in a light and a dark panel, so each
 * panel has its own Toaster (`id`) and its buttons target it (`toasterId`).
 */
export default function SonnerDemo() {
    const toasterId = useId();
    const panelRef = useRef<HTMLDivElement>(null);
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    useEffect(() => {
        setTheme(panelRef.current?.closest('.dark') ? 'dark' : 'light');
    }, []);

    const target = { toasterId };

    return (
        <div ref={panelRef} className="flex flex-wrap gap-2">
            <Button
                variant="outline"
                onClick={() => toast.success('Settings saved', target)}
            >
                Success
            </Button>
            <Button
                variant="outline"
                onClick={() =>
                    toast.info('A new version is available', {
                        ...target,
                        description: 'Reload to use it.',
                    })
                }
            >
                Info
            </Button>
            <Button
                variant="outline"
                onClick={() =>
                    toast.warning('Storage is almost full', {
                        ...target,
                        description: '92% of the disk is used.',
                    })
                }
            >
                Warning
            </Button>
            <Button
                variant="outline"
                onClick={() =>
                    toast.error('The upload failed', {
                        ...target,
                        description: 'The file is larger than 50 MB.',
                    })
                }
            >
                Error
            </Button>
            <Toaster id={toasterId} theme={theme} />
        </div>
    );
}
