<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use RuntimeException;

/**
 * A package eraser broke one rule of the erasure standard. The message
 * starts with the check id (`E3: …`) and never contains a seeded value.
 */
final class ErasureConformanceException extends RuntimeException {}
