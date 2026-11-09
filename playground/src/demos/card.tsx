import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

/** A flat dashboard card (docs/dashboard.md): title, one-line description, content. */
export default function CardDemo() {
    return (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <Card className="xl:col-span-7">
                <CardHeader className="pb-3">
                    <CardTitle>Recent uploads</CardTitle>
                    <CardDescription>
                        Files added in the last 7 days.
                    </CardDescription>
                </CardHeader>
                <CardContent className="text-sm">
                    <div className="flex justify-between">
                        <span className="truncate font-medium">
                            report-q3.pdf
                        </span>
                        <span className="text-right tabular-nums">2.4 MB</span>
                    </div>
                </CardContent>
            </Card>
            <Card className="xl:col-span-5">
                <CardHeader className="pb-3">
                    <CardTitle>Storage</CardTitle>
                    <CardDescription>Used across all disks.</CardDescription>
                </CardHeader>
                <CardContent className="text-2xl font-semibold tabular-nums">
                    18.2 GB
                </CardContent>
            </Card>
        </div>
    );
}
