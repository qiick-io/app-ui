# Chat and Assistant

Chat (`/chat`) and the Assistant (`/ai`) share **one structure**.

**Registry:** `chat-layout` (`ChatLayout`, `ChatListSection`, `ChatListItem`, `ChatThread`, `ChatComposer`), `assistant-panel`, `ai-answer-parts` (with `reasoning`, `tool`, `chain-of-thought`, `sources`, `context`, `shimmer`, `code-block`, `ai-message-parts`), `chat-message-reactions`, `chat-attachment-file`, `chat-reply-quote`, `chat-pinned-bar`, `chat-mention`, `user-hover-card`, `clipboard`, `message`, `bubble`, `page-layout`, `page-header` (`FilterSearch`), `header-icon-button`, `toggle-group`, `empty`.

**Copy from externa-core:** `pages/ai/index.tsx`, `pages/chat/index.tsx`, `components/ai/*` (`ai-chat-messages.tsx`, `ai-composer.tsx`; the panel's streaming, attachments and voice in `ai-assistant-panel.tsx`), `components/chat/*` (`chat-thread-row.tsx`, …).

## Page

- `AppLayout` with the primary action ("New chat") in `headerActions`, then `PageLayout`:
    - `filters`: `FilterSearch` sized like the list column (`w-64 lg:w-80`).
    - `filtersRight`: list actions (Assistant: delete selected; Chat: segmented Collections / Users + archived toggle).
- Body: `ChatLayout`: **list column on the left** (`w-64 lg:w-80`, `border-r`, scrolls, sections with uppercase labels such as Pinned / Today), **thread on the right**.
- **Phone:** pass `isThreadOpen` (a thread or conversation is selected). Below `md` the list and the thread take turns, full width, and the thread header has a back button (`md:hidden`) that clears the selection. Test ids go on the parts through `listColumnProps` / `listProps` / `threadProps` (`data-*` only); the parts also carry `data-slot` (`chat-layout`, `chat-layout-list-column`, `chat-layout-list`, `chat-layout-thread`).
- The thread has **no extra header** in the Assistant: conversation actions live on the list row (⋯ menu on hover). No double header anywhere.
- The **composer is always at the bottom of the right column**: one rounded frame, auto-growing textarea, actions left, round send button right. With no thread selected it stays visible and disabled under the empty state.
- Messages: user bubbles `muted`, aligned end; assistant messages `ghost`, full width; errors `destructive`.
- AI surfaces use the violet `ai` tokens (empty-state tile `bg-ai/10 text-ai`, Assistant nav item), never the brand primary.

## Assistant side panel

- The sidebar Assistant item navigates to `/ai`.
- **⌘J / Ctrl+J** toggles the `assistant-panel` item (`AssistantPanel`): a right-side `Drawer` with the same thread (`children`) and composer (`composer`, a `ChatComposer`). Opening lands focus in the composer; the header has "Open full page" (`onOpenFullPage`).
- Mount it once in the app layout with `enabled={canUseAi && !isAssistantPage}`; it renders nothing and ignores ⌘J when disabled.
- `toggleAssistantPanel()` and `openAssistantPanelWithPrompt(prompt)` (the `ai:toggle` / `ai:open` window events) let the sidebar item and contextual "Ask AI" buttons drive it; `onOpenWithPrompt` seeds a fresh draft.
- There is **no floating button**.

## AI answers

- An answer is a list of **parts** (`lib/ai-message-parts.ts`): reasoning, text, tool calls, provider tools (web search), plus sources and token usage. The stream reducers (`appendReasoning`, `appendText`, `addToolCall`, `applyToolResult`, `markApprovalRequested`, `addProviderTool`, `addSource`) build them live; `partsFromSteps` rebuilds them from the stored steps, so a reload shows the same thing.
- `AiAnswerParts` renders them in order inside the assistant `Bubble` (`ghost`): `Reasoning` (open while it streams, then "Thought for N seconds", collapsed), one `Tool` per call or a `ChainOfThought` for several calls in a row (its title shimmers while a step runs), and text through the app's Markdown renderer (`renderText`; externa-core uses Streamdown, loaded lazily).
- Under the parts: `AiAnswerSources` ("Used N sources") and, in the message footer, `AiAnswerUsage` (AI Elements `Context`: tokens against the model's context window, which the app knows per provider).
- Calls waiting for approval render in the approval block, not as parts (`hidePendingApprovals`).

## Human chat messages

- **Reactions** under the bubble (`ChatMessageReactions`): emoji and count only, one `Button size="xs"` each, pressed (`aria-pressed`) when the viewer reacted; who reacted is in a `Tooltip` and the accessible name, never avatars.
- **Room for reactions.** The pill hangs below the bubble edge by design, and `MessageScrollerItem` uses `content-visibility: auto`, which clips whatever leaves the row. A bubble with reactions takes `mb-6` (the pill is about 21px with its ring); never less, or the last message's reactions are cut off.
- **Photos fill the bubble.** With media, the bubble takes the media's width (the same `w-80` frame for a single photo and for albums), `BubbleContent` drops its padding so the media sits edge to edge under the bubble's rounded top corners, and the caption wraps inside that width. The bubble never grows wider than the media to fit a caption on one line.
- **Reply quote** (`ChatReplyQuote`): a muted `Item` with a left rule, at the top of the reply bubble (jumps to the original) and above the composer while replying (with the cancel action).
- **Pinned bar** (`ChatPinnedBar`): one muted `Item` with a pin per pinned message, above the thread.
- **Files** (`ChatAttachmentFile`): a sent file on `Attachment` (opens on click, ⋮ menu with Download plus app entries); `ChatPendingFile` while it uploads (Spinner and %, error, remove). Images and videos go to the media album instead.
- **Mentions** (`ChatMention`): a primary-tinted secondary `Badge` that opens the `UserHoverCard` (avatar, name, role, online).
- **Copy** always goes through `copyTextToClipboard` (`clipboard`), never `navigator.clipboard` directly: it fails when focus is in a tooltip or outside a secure context.
