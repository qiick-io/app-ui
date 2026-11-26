# Roles and permissions

**Registry:** none (backend, plus the list and form patterns for the roles screens).

**Copy from externa-core:** `app/Enums/PermissionEnum.php`, `app/Enums/RoleEnum.php`, `app/Console/Commands/SyncPermissionsCommand.php`, `app/Http/Middleware/EnsureUserHasPermissionMiddleware.php`, `app/Http/Requests/Concerns/AuthorizesWithPermissionTrait.php`, `app/Services/Authorization/EffectivePermissionResolverService.php`, `app/Models/Role.php`, `config/permission.php` (PHP, repo root); `resources/js/hooks/use-can.ts`, `resources/js/lib/permissions.ts`, roles screens `pages/admin/roles/{index,form}.tsx`. Policies: excubia-app `app/Policies/*Policy.php`.

## Package and names

- `spatie/laravel-permission`. Permissions are cases of a string-backed `PermissionEnum`: `CanShowUsers = 'can-show-users'`, `CanCreateUsers`, `CanEditUsers`, `CanDeleteUsers`, `CanRestoreUsers`, `CanForceDeleteUsers`, `CanShowActivityLogs`, `CanUseAi` (`can-<verb>-<resource>`, kebab-case values).
- Roles are a `RoleEnum`: `super-admin` (everything, through `Gate::before`), `admin` (every permission it was granted), `reader`, plus product roles. A system role that nobody can be assigned (externa's `public`) says so in the enum.

## Role model (decision 2026-11-26)

- **Super-admin is exclusive.** A user holds super-admin alone, or any combination of the other roles. The registry's `RolePicker` (`@qiick/role-picker`) disables the other roles once super-admin is picked and clears them; the server rejects the combination with laravel-access `Qiick\Access\Rules\ExclusiveSuperAdminRoleRule` on the role field of the user requests (`['array', new ExclusiveSuperAdminRoleRule]`).
- **Permissions add up** across the selected roles; the picker says so in its helper text.
- **Human labels:** the picker shows the role's label from `RoleEnum` (`label()`), never the raw slug; without a label it title-cases the name.
- **API keys of a super-admin** reach every permission of `PermissionEnum` that the key's scopes cover (laravel-access `isWithinOwnerCeiling()`), never the `Gate::before` bypass. A product computes the grantable scopes with `isWithinOwnerCeiling()`, not `hasAssignedPermission()`, so a super-admin alone can create a key.

## Initial super admin

The account seeded for a local checkout comes from `.env`, not from a hard-coded password. The same four keys apply in every product:

```dotenv
INITIAL_SUPER_ADMIN_FIRST_NAME=Super
INITIAL_SUPER_ADMIN_LAST_NAME=Admin
INITIAL_SUPER_ADMIN_EMAIL=superadmin@example.com
INITIAL_SUPER_ADMIN_PASSWORD=
```

- `config/super_admin.php` is the only reader: `config('super_admin.first_name')`, `config('super_admin.last_name')`, `config('super_admin.email')` and `config('super_admin.password')`. `example.com` is reserved by RFC 2606, so mail to the default address goes nowhere.
- `CreateSuperAdminSeeder` creates or restores that user with the `super-admin` role. It runs **only** in `local` and `testing`, and **only** when `INITIAL_SUPER_ADMIN_PASSWORD` is non-empty; elsewhere (or with no password) it warns and creates nothing. It is idempotent on the email: an existing user keeps its password and gets the role, verified email and active flag back.
- On a server the first admin comes from `<app>:install` or `<app>:create-user`, which ask for the password. Never use `db:seed` or `migrate --seed` to get a production login; the install and upgrade paths seed permissions only.
- Copy from excubia-app `develop`: `config/super_admin.php`, `database/seeders/CreateSuperAdminSeeder.php`, the four keys in `.env.example`, and `tests/Feature/Security/SeededAdminTest.php` (both guards). Adapt the command name in the seeder's warning to `<app>:create-user`.

## User groups

Every product has groups. A product that truly has no use for them records a divergence instead of omitting them. Groups are instance-level (no organisation or team column), use soft deletes and link to users and Spatie roles through two pivots:

- `user_groups`: `id`, unique `name`, nullable `description`, timestamps and `softDeletes`.
- `user_group_user`: unique `(user_group_id, user_id)`, both foreign keys cascade, timestamps.
- `user_group_role`: unique `(user_group_id, role_id)`, both foreign keys cascade, timestamps; `role_id` points at the table configured in `config/permission.php`.
- `UserGroup::users()` uses the `UserGroupUser` pivot; `UserGroup::roles()` is a plain `belongsToMany`. `User::groups()` is the inverse membership relation. Admin routes resolve soft-deleted groups so they can be restored.
- Roles attached to a group are part of a member's effective roles: `EffectivePermissionResolverService` merges direct and group roles, and the frontend shares the merged names. The six permissions are `CanShowGroups`, `CanCreateGroups`, `CanEditGroups`, `CanDeleteGroups`, `CanRestoreGroups` and `CanForceDeleteGroups`; add them to `PermissionEnum` so `<app>:sync-permissions` writes them to the database and the frontend enum.

**Copy from externa-core `origin/develop`** (verified at `ba50c94`):

- Schema and models: `database/migrations/2026_08_01_000002_create_user_groups_tables.php` (as a new migration in the product), `app/Models/UserGroup.php`, `app/Models/UserGroupUser.php`, `database/factories/UserGroupFactory.php`, `app/Models/User.php` (`groups()` relation only), `app/Services/Authorization/EffectivePermissionResolverService.php`, `app/Enums/PermissionEnum.php` (the six group cases).
- Admin surface: `app/Http/Controllers/Admin/UserGroupController.php`, `app/Http/Controllers/Admin/UserGroupTrashController.php`, `app/Http/Requests/Admin/BulkUserGroupActionRequest.php`, `app/Http/Requests/Admin/StoreUserGroupRequest.php`, `app/Http/Requests/Admin/UpdateUserGroupRequest.php`, `app/Http/Resources/UserGroupResource.php`, `app/Policies/UserGroupPolicy.php`, `routes/admin.php` (group routes).
- Screens: `resources/js/pages/admin/groups/index.tsx`, `resources/js/components/admin/group-form-drawer.tsx`, `resources/js/components/admin/user-group-multi-select.tsx`.
- Tests: `tests/Feature/Admin/UserGroupManagementTest.php`, `tests/Feature/Policies/UserGroupPolicyTest.php`, `tests/Browser/UserGroupBrowserTest.php`.

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
