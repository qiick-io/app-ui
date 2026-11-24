<?php

declare(strict_types=1);

namespace Qiick\Standards\Erasure\Support;

use RuntimeException;

/** Thrown by E9 inside a running erasure, to prove the package rolls its writes back. */
final class InjectedErasureFailureException extends RuntimeException {}
