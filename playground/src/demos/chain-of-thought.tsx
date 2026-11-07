import { Search } from 'lucide-react';
import {
    ChainOfThought,
    ChainOfThoughtContent,
    ChainOfThoughtHeader,
    ChainOfThoughtSearchResult,
    ChainOfThoughtSearchResults,
    ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';

export default function ChainOfThoughtDemo() {
    return (
        <ChainOfThought defaultOpen className="max-w-md">
            <ChainOfThoughtHeader>2 tool steps</ChainOfThoughtHeader>
            <ChainOfThoughtContent>
                <ChainOfThoughtStep
                    icon={Search}
                    label="Searched the web"
                    status="complete"
                >
                    <ChainOfThoughtSearchResults>
                        <ChainOfThoughtSearchResult>
                            laravel.com
                        </ChainOfThoughtSearchResult>
                        <ChainOfThoughtSearchResult>
                            ui.shadcn.com
                        </ChainOfThoughtSearchResult>
                    </ChainOfThoughtSearchResults>
                </ChainOfThoughtStep>
                <ChainOfThoughtStep label="Read 2 pages" status="active" />
            </ChainOfThoughtContent>
        </ChainOfThought>
    );
}
