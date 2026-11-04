# UI section for a qiick app's AGENTS.md / CLAUDE.md

Copy the block below verbatim into the app's `AGENTS.md` (or `CLAUDE.md`). Change only the preset line.

---

## UI (qiick app UI)

This app follows the shared qiick app UI: https://github.com/qiick-io/app-ui. **Read the app-ui [`AGENTS.md`](https://github.com/qiick-io/app-ui/blob/develop/AGENTS.md) and [`docs/`](https://github.com/qiick-io/app-ui/tree/develop/docs) before any UI change.**

- Never invent a layout, component, colour or component position. Install it from the `@qiick` registry (`npx shadcn add @qiick/<name>`); if it is not there yet, copy it from externa-core `develop`; if externa-core has no equivalent, stop and ask Luca.
- Intentional differences go in `app-ui.overrides.json` with a reason; anything else fails the drift check in CI.
- shadcn components and `lucide-react` icons only. Theme tokens only: no hex, no raw palette classes, no arbitrary font sizes. AI surfaces use the violet `ai` tokens; status colours carry status only.
- Control scale `sm` 24 / default 32 / `lg` 40 px; default everywhere.
- WCAG 2.2 AA in light, dark and high contrast.
- Brand preset: **Teal** (replace with this app's preset, e.g. Blue for Excubia). Do not edit surface tokens.
