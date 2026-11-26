<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use Illuminate\Support\Str;

/**
 * One data subject seeded by a package's erasure fixture.
 *
 * Every value is fresh and distinctive, so the suite can search the package's
 * stores for it after an erasure without false positives (a short user id is
 * only compared for equality, never as a substring).
 */
final readonly class ErasurePerson
{
    /**
     * @param  list<string>  $publicIds  principal ids and API key public ids
     * @param  list<string>  $identifiers  email, username and display name
     * @param  list<string>  $otherPersonalValues  further seeded personal values: IP address, user agent
     */
    public function __construct(
        public string $userId,
        public string $userPublicId,
        public array $publicIds,
        public array $identifiers,
        public array $otherPersonalValues,
    ) {}

    /**
     * A person with fresh UUIDs and identifiers for the given user key. The
     * fixture creates the user row itself when its package needs one.
     */
    public static function fresh(string $userId, int $principalCount = 1, int $apiKeyCount = 1): self
    {
        $marker = Str::lower(Str::random(10));
        $publicIds = [];

        for ($index = 0; $index < $principalCount + $apiKeyCount; $index++) {
            $publicIds[] = (string) Str::uuid();
        }

        return new self(
            userId: $userId,
            userPublicId: (string) Str::uuid(),
            publicIds: $publicIds,
            identifiers: ["erasure-{$marker}@example.test", "erasure_{$marker}", "Erasure Subject {$marker}"],
            otherPersonalValues: ['203.0.113.'.random_int(10, 250), "ErasureProbe/{$marker}"],
        );
    }

    /**
     * The values that identify this person and must leave every personal column.
     *
     * @return list<string>
     */
    public function searchableValues(): array
    {
        return [$this->userPublicId, ...$this->publicIds, ...$this->identifiers, ...$this->otherPersonalValues];
    }

    /**
     * The named arguments of `<Package>Eraser::erase()` for this person.
     *
     * @return array{userId: string, userPublicId: string, mode: string, publicIds: list<string>, identifiers: list<string>, organisationId: ?string, dryRun: bool}
     */
    public function arguments(string $mode, ?string $organisationId = null, bool $isDryRun = false): array
    {
        return [
            'userId' => $this->userId,
            'userPublicId' => $this->userPublicId,
            'mode' => $mode,
            'publicIds' => $this->publicIds,
            'identifiers' => $this->identifiers,
            'organisationId' => $organisationId,
            'dryRun' => $isDryRun,
        ];
    }
}
