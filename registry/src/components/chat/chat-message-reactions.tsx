import { useTranslation } from 'react-i18next';
import { BubbleReactions } from '@/components/ui/bubble';
import { Button } from '@/components/ui/button';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

/** One emoji under a message: how many reacted, whether the viewer did, and who. */
export type ChatReaction = {
    emoji: string;
    count: number;
    reacted: boolean;
    users?: Array<{ name: string }>;
};

type ChatMessageReactionsProps = {
    reactions: ChatReaction[];
    align: 'start' | 'end';
    onToggle: (emoji: string) => void;
};

/**
 * Reactions under a chat bubble, on shadcn `BubbleReactions`: one `Button` xs
 * per emoji with its count, pressed when the viewer reacted, and a `Tooltip`
 * naming who reacted. Render it inside the `Bubble`.
 */
export function ChatMessageReactions({
    reactions,
    align,
    onToggle,
}: ChatMessageReactionsProps) {
    const { t } = useTranslation();

    if (reactions.length === 0) {
        return null;
    }

    return (
        <BubbleReactions align={align} data-test="chat-message-reactions">
            {reactions.map((reaction) => {
                const names = (reaction.users ?? [])
                    .map((user) => user.name)
                    .join(', ');

                return (
                    <Tooltip key={reaction.emoji}>
                        <TooltipTrigger asChild>
                            <Button
                                type="button"
                                variant={
                                    reaction.reacted ? 'secondary' : 'ghost'
                                }
                                size="xs"
                                aria-pressed={reaction.reacted}
                                aria-label={t('chat.reactionToggle', {
                                    emoji: reaction.emoji,
                                    names,
                                })}
                                className="rounded-full tabular-nums aria-pressed:bg-primary/15"
                                onClick={() => onToggle(reaction.emoji)}
                            >
                                <span aria-hidden>{reaction.emoji}</span>
                                <span aria-hidden>{reaction.count}</span>
                            </Button>
                        </TooltipTrigger>
                        {names !== '' ? (
                            <TooltipContent>{names}</TooltipContent>
                        ) : null}
                    </Tooltip>
                );
            })}
        </BubbleReactions>
    );
}
