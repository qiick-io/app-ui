import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';

export default function SuggestionDemo() {
    return (
        <Suggestions className="max-w-md">
            <Suggestion suggestion="Add fields to the collection">
                Add fields
            </Suggestion>
            <Suggestion suggestion="Show the items">Show items</Suggestion>
            <Suggestion suggestion="Export the collection as CSV">
                Export CSV
            </Suggestion>
        </Suggestions>
    );
}
