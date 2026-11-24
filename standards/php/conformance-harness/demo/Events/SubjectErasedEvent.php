<?php

declare(strict_types=1);

namespace Qiick\Demo\Events;

use Qiick\Demo\Erasure\ErasureReport;

/** Dispatched after a real erasure commits; it carries only the report. */
final readonly class SubjectErasedEvent
{
    public function __construct(public ErasureReport $report) {}
}
