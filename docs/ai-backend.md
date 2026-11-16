# AI backend

**Registry:** the UI side is `docs/chat-and-assistant.md` (`assistant-panel`, `chat-layout`, `ai-answer-parts`, the `ai` tokens).

**Copy from externa-core:** `config/ai.php`, `app/Ai/Agents/AppAssistant.php`, read tool `app/Ai/Tools/QueryActivityLogs.php`, write tool `app/Ai/Tools/ManageUsers.php`, `app/Enums/AiToolKindEnum.php`, `app/Services/Ai/AiToolWriteGateService.php`, `app/Services/Ai/AiToolApprovalService.php`, `app/Services/Ai/AiToolRegistryService.php`, `app/Ai/Support/AiPendingApprovals.php`, `app/Listeners/Ai/LogAiToolApprovalEventsListener.php`, `routes/ai.php`, tests `tests/Feature/Ai/AiAssistantTest.php` and `AiConversationStepsAndApprovalsTest.php` (PHP, repo root); approvals page `pages/admin/pending-tool-calls/index.tsx`.

Only when the spec asks for AI.

## Provider

- `laravel/ai`. `config/ai.php`: `default` from `AI_DEFAULT_PROVIDER`, a per-feature provider (`assistant.provider`), one block per provider with its model, `reasoning.effort` and `context_window`. Keys only in `.env` or encrypted settings.
- **Off by default:** a fresh install has no provider key, the AI screens say how to configure one, and nothing calls a provider. The default provider is a local OpenAI-compatible URL (LM Studio / Ollama), so turning it on needs no cloud account.
- Every AI route needs `auth`, `verified` and `permission:can-use-ai`; usage is limited per user (`daily_prompt_limit`) and logged (`ai` log name).

## Tools

- Agents in `app/Ai/Agents/`, tools in `app/Ai/Tools/`, one class per tool implementing `Laravel\Ai\Contracts\Tool`, calling the same `*Action` / `*Service` classes as the UI and checking the user's permissions (`ChecksAiPermissionsTrait`), logging every call (`LogsAiToolUseTrait`).
- **Writes on by default** (maintainer decision, 2026-11-16): an assistant that can only read cannot do the work it is for, such as creating collections and items in Externa or resolving and assigning exceptions in Excubia. Each tool declares its kind (`AiToolKindEnum`: `read`, `write`, `destructive`; `writeActions()` / `destructiveActions()` on mixed tools).
    - **`write`** (creates or changes data, reversible: create, update, publish, assign, change a status): on by default. The env switch `AI_TOOLS_WRITE_ENABLED` (default `true`) turns every write off on an install that wants a read-only assistant. The allowlist (`AI_TOOLS_WRITE_ALLOW` or the `ai.write_tools` setting) defaults to every write tool and can narrow it.
    - **`destructive`** (deletes data, or touches security: delete, purge, rotate or revoke tokens, change users, roles or settings): off by default (`AI_TOOLS_DESTRUCTIVE_ENABLED=false`), always approved one call at a time. Security actions (tokens, users, roles, auth settings) are never exposed over MCP.
    - Every tool still checks the acting user's permissions exactly as the UI does: the AI never does more than the person it acts for.
- **Approval (in-app assistant):** a write call becomes a `PendingToolCall` (expires after `approval_ttl_minutes`, 15); the UI shows it in the conversation with Approve / Reject, admins see all pending calls; approving and rejecting fire `ToolApprovalRequested` / `ToolApprovalResolved`, logged. A write can be approved "always" for the conversation; destructive actions approve one call at a time, never "always".
- Secrets in tool inputs and outputs are redacted (`redact_keys`) before logging or sending back to the model.
- **MCP**, if the product exposes one: `laravel/mcp`, the endpoint off by default (`mcp.enabled`), since it opens the app to outside clients. Once it is on, write tools are on too (`mcp.write_enabled`, default `true`) for an API key that has the `mcp:write` scope; a key with only `mcp:read` sees the read tools. Creating a key with `mcp:write` is the user's explicit consent, and the MCP client asks before each call, so there is no in-app approval. Destructive tools follow `AI_TOOLS_DESTRUCTIVE_ENABLED` (default off); security actions never reach MCP. Every call is logged with `surface: mcp`.

## Tests

Never a real provider: `AppAssistant::fake(['…'])`, `Embeddings::fake([...])`, and `Http::fake()` for anything else. Tests cover: AI disabled without a key, a read tool honouring permissions, a write tool working by default and refused with the switch off or when not allowlisted, pending until approved in-app, a destructive tool refused by default, an MCP write refused for an `mcp:read` key, and the activity entries.
