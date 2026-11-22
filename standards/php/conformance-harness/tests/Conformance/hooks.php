<?php

declare(strict_types=1);

/**
 * Harness hooks: behaviour checks that need an app surface are stubbed to pass
 * on the green fixture. RED proofs override or omit them deliberately.
 *
 * @return array<string, callable(): void>
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
    'assertRoleDetachClearsResolver' => static function (): void {},
    'assertExpiredMembershipGrantsNothing' => static function (): void {},
    'assertAccessActivityUuidOnly' => static function (): void {},
];
