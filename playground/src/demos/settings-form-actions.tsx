import { SettingsFormActions } from '@/components/settings-form-actions';

export default function SettingsFormActionsDemo() {
    return (
        <form onSubmit={(event) => event.preventDefault()}>
            <SettingsFormActions processing={false} recentlySuccessful />
        </form>
    );
}
