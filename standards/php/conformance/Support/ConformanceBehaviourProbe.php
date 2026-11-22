<?php

declare(strict_types=1);

namespace Qiick\Standards\Conformance\Support;

/**
 * Passed into access-package behaviour hooks (C71/C73/C74). The hook must
 * exercise the real product path and call {@see pass()}; an empty no-op stays red.
 */
final class ConformanceBehaviourProbe
{
    private bool $hasPassed = false;

    /**
     * Mark the behaviour as exercised and verified.
     */
    public function pass(): void
    {
        $this->hasPassed = true;
    }

    public function hasPassed(): bool
    {
        return $this->hasPassed;
    }
}
