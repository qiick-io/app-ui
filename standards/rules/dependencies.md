# Dependency register

Every Composer package (`package: true` in `qiick-standards.json`) keeps `docs/dependencies.md` up to date. List every runtime entry in the root `composer.json` `require` object, including platform requirements such as `php` and `ext-*`; do not list `require-dev`.

For each dependency, document its version constraint, why that minimum is needed, what the package uses, what it replaces or extends (classes, actions, or config) and why, who maintains it (company, community, or an individual maintainer), its license, known risks, and a one-line exit plan for replacing it inside the package without changing products.

Update the register in every PR that changes `composer.json` `require`, and review it at every release. When the points replaced or extended outnumber the points used, evaluate an in-package implementation.

The package drift check fails when `docs/dependencies.md` is missing or a `require` name is absent from the table's `Dependency` column. It checks coverage by exact dependency name; reviewers remain responsible for the accuracy of the rationale and risk assessment.
