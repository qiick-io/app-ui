import {
    ChatAttachmentFile,
    ChatPendingFile,
} from '@/components/chat/chat-attachment-file';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export default function ChatAttachmentFileDemo() {
    return (
        <div className="flex w-72 flex-col gap-2">
            <ChatAttachmentFile
                name="invoice-0923.pdf"
                href="#/"
                description="248 KB"
                menuItems={<DropdownMenuItem>Save to Files</DropdownMenuItem>}
            />
            <ChatPendingFile
                name="photos.zip"
                description="12.4 MB"
                progress={42}
                error={null}
                uploaded={false}
                onRemove={() => undefined}
            />
            <ChatPendingFile
                name="contract.docx"
                description="88 KB"
                progress={0}
                error="The file is too large."
                uploaded={false}
                onRemove={() => undefined}
            />
        </div>
    );
}
