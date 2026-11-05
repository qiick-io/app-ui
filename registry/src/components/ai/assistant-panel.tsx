import { Maximize2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { HeaderIconButton } from '@/components/admin/header-icon-button';
import {
    Drawer,
    DrawerBody,
    DrawerContent,
    DrawerDescription,
    DrawerFooter,
    DrawerHeader,
    DrawerTitle,
} from '@/components/ui/drawer';

/** Opens the panel with a prefilled composer (externa-core `lib/ai-open.ts`). */
export const ASSISTANT_OPEN_EVENT = 'ai:open';

/** Opens or closes the panel (sidebar Assistant item, ⌘J). */
export const ASSISTANT_TOGGLE_EVENT = 'ai:toggle';

export type AssistantOpenDetail = {
    prompt: string;
};

/**
 * Open or close the Assistant panel on the current page, keeping its thread.
 */
export function toggleAssistantPanel(): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new Event(ASSISTANT_TOGGLE_EVENT));
}

/**
 * Open the Assistant panel with a prefilled composer (does not send), e.g.
 * from a contextual "Ask AI" button.
 */
export function openAssistantPanelWithPrompt(prompt: string): void {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(
        new CustomEvent<AssistantOpenDetail>(ASSISTANT_OPEN_EVENT, {
            detail: { prompt },
        }),
    );
}

type AssistantPanelProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /**
     * False on the full Assistant page and when the user cannot use AI: the
     * panel renders nothing and ⌘J does nothing.
     */
    enabled?: boolean;
    /** An "Ask AI" prompt arrived: start a fresh draft with it. The panel then opens. */
    onOpenWithPrompt?: (prompt: string) => void;
    /** Defaults to "New chat". */
    title?: ReactNode;
    /** Defaults to the "open the full page for history" hint. */
    description?: ReactNode;
    /** Shows the "Open full page" header button. */
    onOpenFullPage?: () => void;
    /** The thread: messages, or an empty state. */
    children: ReactNode;
    /** The composer, pinned to the bottom (a `ChatComposer`). */
    composer: ReactNode;
};

/**
 * Assistant side panel (externa-core `ai-assistant-panel.tsx`): a right-side
 * drawer with the same thread and composer as the Assistant page, on every
 * other page. ⌘J / Ctrl+J and {@link toggleAssistantPanel} toggle it; there is
 * no floating button. Opening lands focus in the composer.
 */
export function AssistantPanel({
    open,
    onOpenChange,
    enabled = true,
    onOpenWithPrompt,
    title,
    description,
    onOpenFullPage,
    children,
    composer,
}: AssistantPanelProps) {
    const { t } = useTranslation();
    // Listeners read the latest props without re-subscribing.
    const latestRef = useRef({ open, onOpenChange, onOpenWithPrompt });

    useEffect(() => {
        latestRef.current = { open, onOpenChange, onOpenWithPrompt };
    }, [open, onOpenChange, onOpenWithPrompt]);

    useEffect(() => {
        if (!enabled) {
            return;
        }

        const onToggle = (): void =>
            latestRef.current.onOpenChange(!latestRef.current.open);

        const onOpen = (event: Event): void => {
            const prompt = (event as CustomEvent<AssistantOpenDetail>).detail
                ?.prompt;

            if (typeof prompt !== 'string') {
                return;
            }

            latestRef.current.onOpenWithPrompt?.(prompt);
            latestRef.current.onOpenChange(true);
        };

        const onKeyDown = (event: KeyboardEvent): void => {
            if (
                (event.metaKey || event.ctrlKey) &&
                !event.altKey &&
                !event.shiftKey &&
                event.key.toLowerCase() === 'j'
            ) {
                event.preventDefault();
                onToggle();
            }
        };

        window.addEventListener(ASSISTANT_OPEN_EVENT, onOpen);
        window.addEventListener(ASSISTANT_TOGGLE_EVENT, onToggle);
        window.addEventListener('keydown', onKeyDown);

        return () => {
            window.removeEventListener(ASSISTANT_OPEN_EVENT, onOpen);
            window.removeEventListener(ASSISTANT_TOGGLE_EVENT, onToggle);
            window.removeEventListener('keydown', onKeyDown);
        };
    }, [enabled]);

    if (!enabled) {
        return null;
    }

    return (
        <Drawer open={open} onOpenChange={onOpenChange} direction="right">
            <DrawerContent
                onOpenAutoFocus={(event) => {
                    // Land in the composer (⌘J then type), never on the header button;
                    // with the composer disabled focus stays on the panel itself.
                    const panel = event.currentTarget;

                    if (!(panel instanceof HTMLElement)) {
                        return;
                    }

                    event.preventDefault();
                    (
                        panel.querySelector<HTMLElement>(
                            'textarea:not([disabled])',
                        ) ?? panel
                    ).focus();
                }}
            >
                <DrawerHeader className="flex-row items-start justify-between gap-2">
                    <div className="grid gap-1">
                        <DrawerTitle>{title ?? t('ai.fabTitle')}</DrawerTitle>
                        <DrawerDescription>
                            {description ?? t('ai.fabDescription')}
                        </DrawerDescription>
                    </div>
                    {onOpenFullPage ? (
                        <HeaderIconButton
                            type="button"
                            variant="ghost"
                            label={t('ai.openFullPage')}
                            data-testid="ai-panel-full-page"
                            onClick={() => {
                                onOpenChange(false);
                                onOpenFullPage();
                            }}
                        >
                            <Maximize2 className="size-4" />
                        </HeaderIconButton>
                    ) : null}
                </DrawerHeader>

                <DrawerBody className="gap-3">{children}</DrawerBody>

                <DrawerFooter className="gap-2">{composer}</DrawerFooter>
            </DrawerContent>
        </Drawer>
    );
}
