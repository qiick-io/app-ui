# WCAG 2.2 AA browser checks

Use [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) for product UIs. Exercise representative routes and open overlays at widths that trigger different layouts. Include light, dark and high contrast.

## Shared CI workflow

Set `wcag22-test` in [`ui-quality.yml`](../.github/workflows/ui-quality.yml) to the Pest browser paths, one per line. Use the same app-ui commit SHA for the workflow call and its `standards-ref` input if the product still uses an earlier standards pack. The step supplies `QIICK_WCAG22_AXE_SCRIPT`, `QIICK_WCAG22_FOCUS_SCRIPT` and a fresh `QIICK_WCAG22_REPORT` file.

Run the shared axe script after Pest has loaded axe, on each covered screen or open overlay. Append each browser result as a line of JSON. The workflow fails if no target-size check ran or a result contains a violation. It prints every distinct needs-review finding in the job log.

```php
$page->assertNoAccessibilityIssues(1);

$scriptPath = getenv('QIICK_WCAG22_AXE_SCRIPT');
$reportPath = getenv('QIICK_WCAG22_REPORT');
$result = $page->script((string) file_get_contents($scriptPath));
file_put_contents($reportPath, json_encode($result, JSON_THROW_ON_ERROR).PHP_EOL, FILE_APPEND | LOCK_EX);
expect($result['violations'])->toBe([]);
```

For focus checks, press Tab or Shift+Tab and assert that the intended control received focus. Evaluate the function in `QIICK_WCAG22_FOCUS_SCRIPT` with a selector for known rectangular, opaque overlays in that state, or `null` when testing uncertain or translucent layers. Append the result to the same report and assert its violations are empty. The function reports definite full coverage by a supplied overlay. Partial, clipped or uncertain coverage needs manual review. Use named routes or test labels in the optional `page` report field. Keep tokens and other transient values out of the report.

## Manual review template

For each row, record the route and state, viewport and theme, result, evidence, and any applicable exception or issue. Automate the listed product interaction where the flow exists and review the remaining cases manually.

| Criterion                                                                                                                       | Automated proof                                                                                               | Manual evidence to record                                                                                                                                                         |
| ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)                             | Shared axe `target-size` rule on each sampled screen.                                                         | Review every needs-review finding. Measure against 24 × 24 CSS pixels and record any applicable spacing, inline, equivalent-control or other exception.                           |
| [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)              | Shared focus assertion after keyboard navigation past a known overlay.                                        | Tab in both directions under sticky headers, footers and banners. Check that some part of the focused control remains visible and review focus contrast under translucent layers. |
| [2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)                                 | Complete the same operation with clicks or taps and assert the resulting state.                               | Inventory drag-only interactions, including touch. Record any essential dragging or unmodified browser controls.                                                                  |
| [3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | Paste into sign-in, recovery and MFA inputs and verify the value or complete a qualifying alternative.        | Review password-manager support, cognitive challenges and external identity providers in the deployment.                                                                          |
| [3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)                                       | Submit an earlier step and assert that the next step pre-fills the repeated value or lets the user select it. | Inventory multi-step flows. Record when repetition is essential, needed for security or the earlier value is invalid.                                                             |
| [3.2.6 Consistent Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html)                                       | Compare the order of known help links and landmarks across a set of related pages.                            | Review each repeated help mechanism across layouts and roles, including external support, and record its relative position.                                                       |
