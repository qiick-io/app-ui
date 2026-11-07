import { useState } from 'react';
import { PaginatedMultiSelect } from '@/components/admin/paginated-multi-select';
import { Label } from '@/components/ui/label';

const DEMO_URL = '/playground/api/users';
const PEOPLE = [
    'Lars Holm',
    'Giulia Ferri',
    'Carolina Bogan',
    'Billie Lemke',
    'Jessi Schinner',
    'Gunnar Heller',
    'Xavier Tromp',
    'Maynard Muller',
    'Eve Rautzer',
    'Rodrigo Frami',
    'Adriel Bruen',
    'Wade Dubuque',
].map((name, index) => {
    const [first_name, last_name] = name.split(' ');

    return {
        id: index + 1,
        first_name,
        last_name,
        email: `${first_name.toLowerCase()}@example.com`,
    };
});

/**
 * Stands in for the Laravel endpoint (`?search=&page=&per_page=` → paginator
 * JSON) so the playground runs without a server. Apps point `fetchUrl` at a
 * real route.
 */
function installDemoEndpoint(): void {
    const realFetch = window.fetch.bind(window);

    if ((window as { demoUsersEndpoint?: boolean }).demoUsersEndpoint) {
        return;
    }

    (window as { demoUsersEndpoint?: boolean }).demoUsersEndpoint = true;
    window.fetch = async (input, init) => {
        const url = new URL(String(input), window.location.origin);

        if (url.pathname !== DEMO_URL) {
            return realFetch(input, init);
        }

        const search = (url.searchParams.get('search') ?? '').toLowerCase();
        const page = Number(url.searchParams.get('page') ?? 1);
        const perPage = Number(url.searchParams.get('per_page') ?? 5);
        const matches = PEOPLE.filter((person) =>
            `${person.first_name} ${person.last_name}`
                .toLowerCase()
                .includes(search),
        );

        return new Response(
            JSON.stringify({
                data: matches.slice((page - 1) * perPage, page * perPage),
                current_page: page,
                last_page: Math.max(1, Math.ceil(matches.length / perPage)),
            }),
            { headers: { 'Content-Type': 'application/json' } },
        );
    };
}

installDemoEndpoint();

export default function PaginatedMultiSelectDemo() {
    const [reviewers, setReviewers] = useState<number[]>([2]);
    const [owner, setOwner] = useState<number[]>([]);

    return (
        <div className="flex w-80 flex-col gap-4">
            <div className="flex flex-col gap-2">
                <Label>Reviewers</Label>
                <PaginatedMultiSelect
                    fetchUrl={DEMO_URL}
                    perPage={5}
                    value={reviewers}
                    onChange={setReviewers}
                    initialOptions={[{ id: 2, label: 'Giulia Ferri' }]}
                    showUserDetails
                />
            </div>
            <div className="flex flex-col gap-2">
                <Label>Owner (single select)</Label>
                <PaginatedMultiSelect
                    fetchUrl={DEMO_URL}
                    perPage={5}
                    multiple={false}
                    value={owner}
                    onChange={setOwner}
                />
            </div>
        </div>
    );
}
