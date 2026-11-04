# Destructive actions

**Registry:** `confirm-destructive-dialog`, `alert-dialog`, `button` (`destructive`, `destructive-outline`, `destructive-ghost`).

**Copy from externa-core:** `components/confirm-destructive-dialog.tsx`; long-running example: `app/Jobs/EmptyFilesTrashJob.php` with `FileController::emptyTrash` (PHP, repo root).

- Every destructive action confirms with an `AlertDialog` (`ConfirmDestructiveDialog`): Cancel / Delete; Esc means Cancel; clicking the overlay does not dismiss.
- **Irreversible** actions (force delete, delete project) pass `typedConfirmation`: the confirm button stays disabled until the user types the name.
- Bulk delete in a selection bar uses `variant="destructive-outline"`; the destructive fill is for the dialog's confirm.
- **Long operations** (empty trash, bulk work on many records) run as a queued job and report through a notification; the dialog closes right away. Do not block the page with a spinner.
