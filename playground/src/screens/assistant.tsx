import { Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { HeaderIconButton } from '@/components/admin/header-icon-button';
import { FilterSearch } from '@/components/layout/page-header';
import { PageLayout } from '@/components/layout/page-layout';
import { Button } from '@/components/ui/button';
import { ChatThreadDemo } from './chat-thread-demo';
import { DemoShell } from './demo-shell';

/** externa-core `/ai` (pages/ai/index.tsx). */
export function AssistantScreen() {
    const [query, setQuery] = useState('');

    return (
        <DemoShell
            active="assistant"
            breadcrumbs={[{ title: 'Assistant', href: '#/assistant' }]}
            headerActions={
                <Button type="button">
                    <Plus className="size-4" />
                    New chat
                </Button>
            }
        >
            <PageLayout
                filters={
                    <FilterSearch
                        className="w-64 flex-none sm:max-w-none lg:w-80"
                        value={query}
                        placeholder="Search conversations…"
                        onChange={setQuery}
                    />
                }
                filtersRight={
                    <HeaderIconButton
                        type="button"
                        variant="outline"
                        disabled
                        label="Delete selected chats"
                    >
                        <Trash2 className="size-4" />
                    </HeaderIconButton>
                }
            >
                <ChatThreadDemo />
            </PageLayout>
        </DemoShell>
    );
}
