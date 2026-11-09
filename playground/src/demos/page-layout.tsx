import { PageLayout, TablePanel } from '@/components/layout/page-layout';
import TableDemo from './table';

/** The full page with the pagination footer is on the Users screen. */
export default function PageLayoutDemo() {
    return (
        <div className="flex h-72 flex-col rounded-md border">
            <PageLayout description="Page description, filter row, flat table panel.">
                <TablePanel>
                    <TableDemo />
                </TablePanel>
            </PageLayout>
        </div>
    );
}
