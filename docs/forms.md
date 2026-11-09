# Forms

**Registry:** `field`, `input`, `textarea`, `select`, `native-select`, `checkbox`, `switch`, `radio-group`, `drawer`, `dialog`, `settings-form-actions`, `paginated-multi-select`.

**Copy from externa-core:** drawer form `components/admin/user-form-drawer.tsx` (also `group-form-drawer.tsx`, `collections/collection-form-drawer.tsx`) with `hooks/use-drawer-deep-link.ts` and `hooks/use-unsaved-changes.ts`; full-page form `pages/admin/roles/form.tsx` (`useForm`) and `pages/collections/items/form.tsx` (`<Form>`); settings forms `pages/settings/**`; requests `app/Http/Requests/Admin/StoreUserRequest.php`, `UpdateUserRequest.php`, `Concerns/AuthorizesWithPermissionTrait.php` (PHP, repo root).

## Page, drawer or dialog

| The record has                                                      | Use                                                                                     |
| ------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| a handful of fields, created or edited from its list                | a **right drawer** (`Drawer direction="right"`, vaul), opened from the list page        |
| many fields, sections, tabs, or its own URL worth sharing           | a **full page** (`/things/create`, `/things/{id}/edit`) with actions in `headerActions` |
| one or two fields and a one-shot result (create an API key, rename) | a **dialog** (`pages/admin/api-keys/index.tsx`)                                         |
| settings of the app or the user                                     | the settings page (`docs/settings.md`): `<Form>` and the sticky Save bar                |

`Sheet` is for read-only side panels (details, notifications), never for a form. A drawer form keeps its state in the URL (`?new=1`, `?edit=12`) through `useDrawerDeepLink`, so reload and Back work.

## Fields and errors

Every control sits in a shadcn `Field`; the server's errors are the only validation the user sees (`noValidate` on the form):

```tsx
<Field data-invalid={errors.email ? true : undefined}>
    <FieldLabel htmlFor="email">{t('users.form.email')} *</FieldLabel>
    <Input id="email" aria-invalid={Boolean(errors.email)} aria-describedby="email-error" … />
    <FieldError id="email-error">{errors.email}</FieldError>
</Field>
```

- Group with `FieldGroup` / `FieldSet` + `FieldLegend`; hints with `FieldDescription`. Required fields end the label with ` *` and the form has one `requiredHint` line.
- No `InputError` or hand-made error paragraphs: `FieldError` only.
- Labels, hints and errors go through `t('…')`; Laravel's validation messages come translated from `lang/<locale>/validation.php`.

## Submitting

- Drawers and multi-step pages: `useForm` (`setData` / `setDefaults` when the drawer opens, `transform` to drop empty optional values, `preserveScroll: true`, `reset()` on success). Simple pages: `<Form {...store.form()} resetOnSuccess noValidate>{({ processing, errors }) => …}</Form>`. Routes from Wayfinder.
- The submit button sits bottom-right (drawer footer: Cancel then the primary action), shows `processing` with `Spinner` and is disabled while it runs.
- Unsaved changes register with `useRegisterUnsavedChanges({ scope: 'drawer', isDirty, onDiscard })`: closing a dirty drawer asks first.
- Success: the drawer closes and `toast.success()` confirms (`docs/notifications.md`); errors stay inline, plus `toast.error()` only for failures that are not about a field.

## Server side

`Store<Model>Request` / `Update<Model>Request` in `app/Http/Requests/<Area>/`; `authorize()` checks the permission (`authorizePermission(PermissionEnum::CanCreateUsers->value)`) or the policy; the controller passes `validated()` as a `*Data` DTO to an `*Action` (`standards/rules/backend.md`).
