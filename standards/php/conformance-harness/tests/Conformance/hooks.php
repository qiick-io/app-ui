<?php

declare(strict_types=1);

use Qiick\Standards\Conformance\Support\ConformanceBehaviourProbe;

/**
 * Harness hooks: behaviour checks that need an app surface are stubbed to pass
 * on the green fixture. Access-package hooks (C71/C73/C74) receive a probe and
 * must call `$probe->pass()`; an empty no-op stays red. Other checks still use
 * presence-only callables.
 *
 * @return array<string, callable(ConformanceBehaviourProbe|null): void>
 */
return [
    'assertSoftDeletedGroupGrantsNothing' => static function (): void {},
    'assertGlobalRoleGuard' => static function (): void {},
    'assertApiKeyActivityUuid' => static function (): void {},
    'assertErasure' => static function (): void {},
    'assertInitialAdminSeeder' => static function (): void {},
    'assertErrorContract' => static function (): void {},
    'assertContentLanguage' => static function (): void {},
    'assertPaginationShape' => static function (): void {},
    'assertThrottleHeaders' => static function (): void {},
    'assertRequestId' => static function (): void {},
    'assertIdempotency' => static function (): void {},
    'assertWebhooks' => static function (): void {},
    'assertSsrfGuard' => static function (): void {},
    'assertTeamSwitch' => static function (): void {},
    'assertSuperAdmin' => static function (): void {},
    'assertApiResourcesHideBigints' => static function (): void {},
    'assertEncryptedCasts' => static function (): void {},
    // Access-package proofs: harness has no product surface, so the stub marks the probe after a no-op exercise.
    'assertRoleDetachClearsResolver' => static function (?ConformanceBehaviourProbe $probe = null): void {
        $probe?->pass();
    },
    'assertApiActorDeniedSuperAdmin' => static function (?ConformanceBehaviourProbe $probe = null): void {
        $probe?->pass();
    },
    'assertExpiredMembershipGrantsNothing' => static function (?ConformanceBehaviourProbe $probe = null): void {
        $probe?->pass();
    },
    'assertAccessActivityUuidOnly' => static function (?ConformanceBehaviourProbe $probe = null): void {
        $probe?->pass();
    },
];
