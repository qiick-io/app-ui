# Chat and Assistant

Chat (`/chat`) and the Assistant (`/ai`) share **one structure**.

**Registry:** `chat-layout` (`ChatLayout`, `ChatListSection`, `ChatListItem`, `ChatThread`, `ChatComposer`), `message`, `bubble`, `page-layout`, `page-header` (`FilterSearch`), `header-icon-button`, `toggle-group`, `empty`.

**Copy from externa-core:** `pages/ai/index.tsx`, `pages/chat/index.tsx`, `components/ai/*` (`ai-chat-messages.tsx`, `ai-composer.tsx`, `ai-assistant-panel.tsx`), `components/chat/*` (`chat-thread-row.tsx`, …), `lib/composer-chrome.ts`, `hooks/use-autosize-textarea.ts`, `lib/ai-open.ts`.

## Page

- `AppLayout` with the primary action ("New chat") in `headerActions`, then `PageLayout`:
    - `filters`: `FilterSearch` sized like the list column (`w-64 lg:w-80`).
    - `filtersRight`: list actions (Assistant: delete selected; Chat: segmented Collections / Users + archived toggle).
- Body: `ChatLayout`: **list column on the left** (`w-64 lg:w-80`, `border-r`, scrolls, sections with uppercase labels such as Pinned / Today), **thread on the right**.
- The thread has **no extra header** in the Assistant: conversation actions live on the list row (⋯ menu on hover). No double header anywhere.
- The **composer is always at the bottom of the right column**: one rounded frame, auto-growing textarea, actions left, round send button right. With no thread selected it stays visible and disabled under the empty state.
- Messages: user bubbles `muted`, aligned end; assistant messages `ghost`, full width; errors `destructive`.
- AI surfaces use the violet `ai` tokens (empty-state tile `bg-ai/10 text-ai`, Assistant nav item), never the brand primary.

## Assistant side panel

- The sidebar Assistant item navigates to `/ai`.
- **⌘J / Ctrl+J** toggles `components/ai/ai-assistant-panel.tsx`: a right-side `Drawer` with the same thread and composer.
- There is **no floating button**.
