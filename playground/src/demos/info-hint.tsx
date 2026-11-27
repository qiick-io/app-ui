import { InfoHint } from '@/components/info-hint';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Page text (docs/page.md): the definition behind an info icon next to the card title, not a
 * paragraph under it.
 */
export default function InfoHintDemo() {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-1">
                    Projects
                    <InfoHint label="About Projects">
                        A project can move when none of its direct dependencies
                        blocks the next Laravel major. A dismissed blocker does
                        not block.
                    </InfoHint>
                </CardTitle>
            </CardHeader>
        </Card>
    );
}
