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
- **Read-only by default.** Each tool declares its kind (`AiToolKindEnum`: `read`, `write`, `destructive`; `writeActions()` / `destructiveActions()` on mixed tools). Write and destructive actions run only when all three hold: the env kill switch `AI_TOOLS_WRITE_ENABLED=true` (default `false`), the tool is on the allowlist (`AI_TOOLS_WRITE_ALLOW` or the `ai.write_tools` setting), and the user approves the call.
- **Approval:** a write call becomes a `PendingToolCall` (expires after `approval_ttl_minutes`, 15); the UI shows it in the conversation with Approve / Reject, admins see all pending calls; approving and rejecting fire `ToolApprovalRequested` / `ToolApprovalResolved`, logged. Destructive actions approve one call at a time, never "always".
- Secrets in tool inputs and outputs are redacted (`redact_keys`) before logging or sending back to the model.
- MCP, if the product exposes one: `laravel/mcp`, off by default (`mcp.enabled`), writes separately off (`mcp.write_enabled`), API-key scopes `mcp:read` / `mcp:write`.

## Tests

Never a real provider: `AppAssistant::fake(['…'])`, `Embeddings::fake([...])`, and `Http::fake()` for anything else. Tests cover: AI disabled without a key, a read tool honouring permissions, a write tool refused with the kill switch off, refused when not allowlisted, pending until approved, and the activity entries.
