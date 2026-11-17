import {
    PageLayout,
    TablePanel,
    TablePaginationFooter,
} from '@/components/layout/page-layout';
import type { TablePaginationState } from '@/components/layout/page-layout';
import TableDemo from './table';

/**
 * A paginator state as Laravel sends it, for `currentPage` of `lastPage` at 20 rows per page.
 * Only Previous, the current page and Next need links: the footer builds the rest.
 */
function paginatorAt(
    currentPage: number,
    lastPage: number,
): TablePaginationState {
    const pageUrl = (page: number): string =>
        `#/components/page-layout?page=${page}`;

    return {
        current_page: currentPage,
        last_page: lastPage,
        per_page: 20,
        total: lastPage * 20 - 9,
        links: [
            {
                url: currentPage > 1 ? pageUrl(currentPage - 1) : null,
                label: '&laquo; Previous',
                active: false,
            },
            {
                url: pageUrl(currentPage),
                label: String(currentPage),
                active: true,
            },
            {
                url: currentPage < lastPage ? pageUrl(currentPage + 1) : null,
                label: 'Next &raquo;',
                active: false,
            },
        ],
    };
}

/** Page counts and positions that stress the compact window (#150). */
const PAGINATION_CASES: Array<[number, number]> = [
    [1, 7],
    [4, 8],
    [61, 120],
    [1, 12854],
    [6421, 12854],
    [12853, 12854],
];

/** The full page with the pagination footer is on the Users screen; below, the footer at large page counts. */
export default function PageLayoutDemo() {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex h-72 flex-col rounded-md border">
                <PageLayout description="Page description, filter row, flat table panel.">
                    <TablePanel>
                        <TableDemo />
                    </TablePanel>
                </PageLayout>
            </div>
            <div className="flex flex-col gap-3">
                {PAGINATION_CASES.map(([currentPage, lastPage]) => (
                    <div
                        key={`${currentPage}-${lastPage}`}
                        className="rounded-md border p-3"
                    >
                        <TablePaginationFooter
                            pagination={paginatorAt(currentPage, lastPage)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
