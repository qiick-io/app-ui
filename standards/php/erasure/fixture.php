<?php

declare(strict_types=1);

/**
 * Erasure fixture for the package erasure conformance suite (E1–E14).
 *
 * The sync writes this file once and never overwrites or checks it: it is the
 * package's own. Return an object implementing
 * `Qiick\Standards\Erasure\Support\ErasureFixture` that seeds one person's data
 * in every store the eraser touches and classifies every column of those
 * tables. Its class docblock lists every cache, disk and further connection
 * the package uses with the person's data, and seed() writes one entry in each. Until it does, the suite
 * has one red test.
 *
 * Standard and an example: `.qiick/standards/erasure.md`.
 */
return null;
