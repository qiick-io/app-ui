# Security checklist: properties and the tests that cover them

Each security property of the package names the test that fails when the property breaks, so the 1.0 checklist ("every security item has a red-first test that names it") can be checked line by line. **Gap** marks a property with no test, **Partial** one whose test covers only part of it. The reference is `qiick/laravel-http-basics`.

Use stable property IDs so products can cite a versioned row and its test as evidence for inherited controls in their F34 ASVS register.

| #   | Property     | Covering test                       | Status  |
| --- | ------------ | ----------------------------------- | ------- |
| S1  | `<property>` | `<TestFile>` › `<test description>` | Covered |
