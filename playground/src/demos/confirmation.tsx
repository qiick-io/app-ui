import { Confirmation } from '@/components/ai-elements/confirmation';

export default function ConfirmationDemo() {
    return (
        <div className="max-w-md">
            <Confirmation
                title="Delete the collection Products?"
                description="Its 120 items move to the trash."
                onApprove={() => undefined}
                onDeny={() => undefined}
            />
        </div>
    );
}
