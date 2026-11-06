import { FileText } from 'lucide-react';
import {
    Attachment,
    AttachmentContent,
    AttachmentDescription,
    AttachmentGroup,
    AttachmentMedia,
    AttachmentTitle,
} from '@/components/ui/attachment';

/** Files attached to a message or a composer. */
export default function AttachmentDemo() {
    return (
        <AttachmentGroup>
            <Attachment>
                <AttachmentMedia>
                    <FileText />
                </AttachmentMedia>
                <AttachmentContent>
                    <AttachmentTitle>brief-2026.pdf</AttachmentTitle>
                    <AttachmentDescription>PDF · 1.2 MB</AttachmentDescription>
                </AttachmentContent>
            </Attachment>
        </AttachmentGroup>
    );
}
