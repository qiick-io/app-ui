<?php

declare(strict_types=1);

namespace Qiick\DemoBroken\Erasure;

/** An eraser whose signature breaks the standard (mode before the public id), for the E1 RED proof. */
final class DemoBrokenEraser
{
    public const string DELETE = 'delete';

    public const string ANONYMISE = 'anonymise';

    /**
     * @param  list<string>  $publicIds
     * @param  list<string>  $identifiers
     */
    public function erase(
        string $userId,
        string $mode,
        string $userPublicId,
        array $publicIds = [],
        array $identifiers = [],
        ?string $organisationId = null,
        bool $dryRun = false,
    ): object {
        return (object) [];
    }
}
