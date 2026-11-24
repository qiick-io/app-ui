# Dependency register

Document every runtime entry from the root `composer.json` `require` object, including platform requirements such as `php` and `ext-*`. Do not include `require-dev` dependencies. Keep one row per dependency and replace the example row below.

| Dependency | Version constraint | Why this minimum | What we use | What we replace or extend and why    | Maintainer                            | License     | Known risk             | Exit plan within this package       |
| ---------- | ------------------ | ---------------- | ----------- | ------------------------------------ | ------------------------------------- | ----------- | ---------------------- | ----------------------------------- |
| `<name>`   | `<constraint>`     | `<reason>`       | `<usage>`   | `<classes, actions, or config; why>` | `<company, community, or individual>` | `<license>` | `<risk or none known>` | `<one-line in-package replacement>` |
