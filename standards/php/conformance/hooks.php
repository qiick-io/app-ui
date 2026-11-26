<?php

declare(strict_types=1);

/**
 * Product-owned behaviour hooks for the fleet conformance suite.
 *
 * The sync writes this file once and never overwrites or checks it: it is the
 * repo's own. Scalar product settings (user model, table names, feature flags)
 * live in `qiick-standards.json` → `conformance`. Callables that exercise the
 * real app (soft-deleted groups, erasure, SSRF, …) go here.
 *
 * Most keys are presence-only (`ConformanceHooks::requireCallable()`). Access-
 * package hooks C71/C73/C74 receive a `ConformanceBehaviourProbe` and must call
 * `$probe->pass()` after exercising the real path — an empty no-op stays red.
 *
 * Omit a key until the product is ready; the check fails until you implement
 * it or declare a divergence in `qiick-standards.json`.
 *
 * @return array<string, callable(\Qiick\Standards\Conformance\Support\ConformanceBehaviourProbe|null): void>
 */
return [
    // C3 needs one users row. It uses the factory of conformance.userModel; without
    // one, return a created user (or its key) here:
    // 'fixtureUser' => fn () => \App\Models\User::query()->create([...]),
    // 'assertSoftDeletedGroupGrantsNothing' => function (): void { ... },
    // 'assertGlobalRoleGuard' => function (): void { ... },
    // 'assertApiKeyActivityUuid' => function (): void { ... },
    // 'assertErasure' => function (): void { ... },
    // 'assertInitialAdminSeeder' => function (): void { ... },
    // 'assertErrorContract' => function (): void { ... },
    // 'assertContentLanguage' => function (): void { ... },
    // 'assertPaginationShape' => function (): void { ... },
    // 'assertThrottleHeaders' => function (): void { ... },
    // 'assertRequestId' => function (): void { ... },
    // 'assertIdempotency' => function (): void { ... },
    // 'assertWebhooks' => function (): void { ... },
    // 'assertSsrfGuard' => function (): void { ... },
    // 'assertTeamSwitch' => function (): void { ... },
    // 'assertSuperAdmin' => function (): void { ... },
    // 'assertApiResourcesHideBigints' => function (): void { ... },
    // 'assertEncryptedCasts' => function (): void { ... },
    // C71 — receive $probe, exercise detach/clear, then $probe->pass():
    // 'assertRoleDetachClearsResolver' => function ($probe): void { ... },
    // 'assertApiActorDeniedSuperAdmin' => function ($probe): void { ... },
    // C73:
    // 'assertExpiredMembershipGrantsNothing' => function ($probe): void { ... },
    // C74:
    // 'assertAccessActivityUuidOnly' => function ($probe): void { ... },
];
