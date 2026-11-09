# Roles and permissions

**Registry:** none (backend, plus the list and form patterns for the roles screens).

**Copy from externa-core:** `app/Enums/PermissionEnum.php`, `app/Enums/RoleEnum.php`, `app/Console/Commands/SyncPermissionsCommand.php`, `app/Http/Middleware/EnsureUserHasPermissionMiddleware.php`, `app/Http/Requests/Concerns/AuthorizesWithPermissionTrait.php`, `app/Services/Authorization/EffectivePermissionResolverService.php`, `app/Models/Role.php`, `config/permission.php` (PHP, repo root); `resources/js/hooks/use-can.ts`, `resources/js/lib/permissions.ts`, roles screens `pages/admin/roles/{index,form}.tsx`. Policies: excubia-app `app/Policies/*Policy.php`.

## Package and names

- `spatie/laravel-permission`. Permissions are cases of a string-backed `PermissionEnum`: `CanShowUsers = 'can-show-users'`, `CanCreateUsers`, `CanEditUsers`, `CanDeleteUsers`, `CanRestoreUsers`, `CanForceDeleteUsers`, `CanShowActivityLogs`, `CanUseAi` (`can-<verb>-<resource>`, kebab-case values).
- Roles are a `RoleEnum`: `super-admin` (everything, through `Gate::before`), `admin` (every permission it was granted), `reader`, plus product roles. A system role that nobody can be assigned (externa's `public`) says so in the enum.

## `<app>:sync-permissions`

The enum is the source; the database follows it:

- creates each missing permission, grants newly created ones to `admin`, resets the permission cache; `--prune` deletes permissions no longer in the enum;
- writes `resources/js/enums/permission-enum.ts` (`export enum PermissionEnum`), so the UI uses the same values;
- runs from `<app>:install` and `<app>:upgrade`; seeders never create permissions by hand.

(externa-core names it `permissions:sync`; new products use the `<app>:` namespace like every other command of theirs.)

## Checking

| Where                         | How                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route groups                  | `->middleware('permission:'.PermissionEnum::CanShowUsers->value)` (alias of `EnsureUserHasPermissionMiddleware`, aborts 403)                                           |
| Writes                        | `FormRequest::authorize()` → `$this->authorizePermission(PermissionEnum::CanEditUsers->value)`                                                                         |
| One record (ownership, state) | a `*Policy` method, through `Gate::authorize('update', $project)`                                                                                                      |
| Frontend                      | `HandleInertiaRequests` shares `auth: { user, permissions, roleNames, isSuperAdmin }`; `const { can } = useCan(); can(PermissionEnum.CanCreateUsers)` hides the action |

Hidden is not protected: every action the UI hides is also refused by the server, and a test proves the 403.
