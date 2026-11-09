import {
    NativeSelect,
    NativeSelectOption,
} from '@/components/ui/native-select';

export default function NativeSelectDemo() {
    return (
        <NativeSelect aria-label="Role" defaultValue="editor">
            <NativeSelectOption value="admin">Admin</NativeSelectOption>
            <NativeSelectOption value="editor">Editor</NativeSelectOption>
            <NativeSelectOption value="reader">Reader</NativeSelectOption>
        </NativeSelect>
    );
}
