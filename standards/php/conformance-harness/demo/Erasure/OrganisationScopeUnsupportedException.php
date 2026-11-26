<?php

declare(strict_types=1);

namespace Qiick\Demo\Erasure;

use LogicException;

/** Thrown before any write when an organisation-scoped run cannot be honoured. */
final class OrganisationScopeUnsupportedException extends LogicException {}
