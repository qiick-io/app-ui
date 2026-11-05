import { Sparkles } from 'lucide-react';
import { useState } from 'react';
import { AssistantPanel } from '@/components/ai/assistant-panel';
import { ChatComposer } from '@/components/layout/chat-layout';
import { Button } from '@/components/ui/button';

/**
 * Opened by the button here; on the screens (`#/users`, …) ⌘J / Ctrl+J opens
 * it. `enabled` follows `open` so the two catalogue copies don't both answer ⌘J.
 */
export default function AssistantPanelDemo() {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState('');

    return (
        <>
            <Button variant="outline" onClick={() => setOpen(true)}>
                <Sparkles className="size-4" />
                Open Assistant panel
            </Button>
            <AssistantPanel
                open={open}
                onOpenChange={setOpen}
                enabled={open}
                onOpenFullPage={() => (window.location.hash = '#/assistant')}
                composer={
                    <ChatComposer
                        value={draft}
                        onChange={setDraft}
                        onSubmit={() => setDraft('')}
                        label="Message"
                        sendLabel="Send"
                        placeholder="Ask anything…"
                    />
                }
            >
                <p className="text-sm text-muted-foreground">
                    Ask about your project.
                </p>
            </AssistantPanel>
        </>
    );
}
