import { FileText, MoreVertical, Trash2, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Attachment,
    AttachmentAction,
    AttachmentActions,
    AttachmentContent,
    AttachmentDescription,
    AttachmentMedia,
    AttachmentTitle,
    AttachmentTrigger,
} from '@/components/ui/attachment';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Spinner } from '@/components/ui/spinner';

type ChatAttachmentFileProps = {
    name: string;
    /** Download / open URL; the whole row opens it. */
    href: string;
    /** Secondary line, usually the formatted size ("2.4 MB"). */
    description?: ReactNode;
    /** Extra menu entries after Download (`DropdownMenuItem`s: save to Files, add to a field, …). */
    menuItems?: ReactNode;
};

/**
 * A sent (non-media) chat file on shadcn `Attachment`: icon, name and size,
 * opening the download on click, with a ⋮ menu (Download plus the app's own
 * entries).
 */
export function ChatAttachmentFile({
    name,
    href,
    description,
    menuItems,
}: ChatAttachmentFileProps) {
    const { t } = useTranslation();

    return (
        <Attachment
            size="sm"
            className="w-full"
            data-test="chat-attachment-file"
        >
            <AttachmentMedia>
                <FileText className="text-muted-foreground" />
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>{name}</AttachmentTitle>
                {description ? (
                    <AttachmentDescription>{description}</AttachmentDescription>
                ) : null}
            </AttachmentContent>
            <AttachmentTrigger asChild>
                <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={name}
                />
            </AttachmentTrigger>
            <AttachmentActions>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <AttachmentAction
                            aria-label={t('chat.more')}
                            onContextMenu={(event) => event.stopPropagation()}
                        >
                            <MoreVertical />
                        </AttachmentAction>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                            <a href={href} target="_blank" rel="noreferrer">
                                {t('chat.download')}
                            </a>
                        </DropdownMenuItem>
                        {menuItems}
                    </DropdownMenuContent>
                </DropdownMenu>
            </AttachmentActions>
        </Attachment>
    );
}

type ChatPendingFileProps = {
    name: string;
    /** Shown when not uploading or failed, usually the formatted size. */
    description?: ReactNode;
    /** Upload progress, 0–100. */
    progress: number;
    error: string | null;
    uploaded: boolean;
    onRemove: () => void;
};

/**
 * A file still on its way into a chat message, on shadcn `Attachment`: a
 * `Spinner` and the progress while it uploads, the error when it failed, and
 * a remove action.
 */
export function ChatPendingFile({
    name,
    description,
    progress,
    error,
    uploaded,
    onRemove,
}: ChatPendingFileProps) {
    const { t } = useTranslation();
    const state = error ? 'error' : uploaded ? 'done' : 'uploading';

    return (
        <Attachment
            size="xs"
            state={state}
            className="w-full"
            data-test="chat-pending-file"
        >
            <AttachmentMedia>
                {state === 'uploading' ? (
                    <Spinner />
                ) : state === 'error' ? (
                    <TriangleAlert />
                ) : (
                    <FileText className="text-muted-foreground" />
                )}
            </AttachmentMedia>
            <AttachmentContent>
                <AttachmentTitle>{name}</AttachmentTitle>
                <AttachmentDescription>
                    {error ??
                        (state === 'uploading' && progress > 0
                            ? `${progress}%`
                            : description)}
                </AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions>
                <AttachmentAction
                    aria-label={t('chat.removePendingFile')}
                    onClick={onRemove}
                >
                    <Trash2 />
                </AttachmentAction>
            </AttachmentActions>
        </Attachment>
    );
}
