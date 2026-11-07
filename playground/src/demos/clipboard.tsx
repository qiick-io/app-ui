import { Check, Copy } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { copyTextToClipboard } from '@/lib/clipboard';

export default function ClipboardDemo() {
    const [isCopied, setIsCopied] = useState(false);

    return (
        <Button
            variant="outline"
            onClick={() => {
                void copyTextToClipboard('qk_live_demo_key').then(setIsCopied);
            }}
        >
            {isCopied ? <Check /> : <Copy />}
            {isCopied ? 'Copied' : 'Copy API key'}
        </Button>
    );
}
