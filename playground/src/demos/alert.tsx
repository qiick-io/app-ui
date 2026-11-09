import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function AlertDemo() {
    return (
        <div className="flex w-full max-w-md flex-col gap-3">
            <Alert>
                <Info />
                <AlertTitle>Default</AlertTitle>
                <AlertDescription>Neutral information.</AlertDescription>
            </Alert>
            <Alert variant="info">
                <Info />
                <AlertTitle>Info</AlertTitle>
                <AlertDescription>A sync is running.</AlertDescription>
            </Alert>
            <Alert variant="success">
                <CircleCheck />
                <AlertTitle>Success</AlertTitle>
                <AlertDescription>The import finished.</AlertDescription>
            </Alert>
            <Alert variant="warning">
                <TriangleAlert />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>The brand colour fails AA.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
                <CircleAlert />
                <AlertTitle>Destructive</AlertTitle>
                <AlertDescription>The upload failed.</AlertDescription>
            </Alert>
        </div>
    );
}
