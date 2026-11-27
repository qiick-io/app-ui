# WCAG 2.2 AA browser checks

Use [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) for every product UI. Keep the existing axe smoke and theme contrast checks. The six additional Level A and AA criteria need rendered pages and user workflows. Exercise product routes at widths that trigger different layouts, and check light, dark and high contrast.

| Criterion                                                                                                                       | Browser proof                                                                                                                                                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [2.5.8 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html)                             | Run the shared axe `target-size` rule on each representative screen and open overlay. Targets must measure at least 24 × 24 CSS pixels or meet an exception such as spacing or inline text. Review axe's needs-review results and documented exceptions.                                                   |
| [2.4.11 Focus Not Obscured (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html)              | In flows with sticky headers, footers, drawers or banners, press Tab and Shift+Tab to real controls. Assert that some part of the focused control remains visible. For known opaque overlays, compare the focused control's visible bounds with the overlay. Review other layers and breakpoints visually. |
| [2.5.7 Dragging Movements](https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html)                                 | For each drag UI, complete the same operation with clicks or taps alone and assert the resulting state. Record essential dragging or unmodified browser controls as exceptions.                                                                                                                            |
| [3.3.8 Accessible Authentication (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/accessible-authentication-minimum.html) | Exercise sign-in, recovery and MFA. Verify that paste or password-manager assistance works for each relevant challenge, or test a qualifying alternative authentication path. Review any cognitive challenges hosted by an external provider in that deployment.                                           |
| [3.3.7 Redundant Entry](https://www.w3.org/WAI/WCAG22/Understanding/redundant-entry.html)                                       | Advance a multi-step flow that asks for information already supplied. Assert that the value is prefilled or selectable, unless re-entry is essential, needed for security or the earlier value is no longer valid.                                                                                         |
| [3.2.6 Consistent Help](https://www.w3.org/WAI/WCAG22/Understanding/consistent-help.html)                                       | On related pages that repeat a help mechanism, compare its order relative to adjacent landmarks and repeated controls in the same layout. Include each role or state that changes those controls.                                                                                                          |

## Shared CI workflow

Point `wcag22-test` in [`ui-quality.yml`](../.github/workflows/ui-quality.yml) at the product's Pest browser suite. The step receives `QIICK_WCAG22_AXE_SCRIPT`, an absolute path to the shared browser assertion from the project's app-ui standards ref. Pass the same environment variable when running the suite locally.

Run the assertion on every covered screen or open overlay after Pest has loaded axe. It returns axe violations and any rule execution errors with the affected selectors. The level passed to Pest's general axe assertion has no effect on this assertion.

```php
$page->assertNoAccessibilityIssues(1);

$scriptPath = getenv('QIICK_WCAG22_AXE_SCRIPT');
expect($scriptPath)->toBeString();
expect($page->script((string) file_get_contents($scriptPath)))->toBe([]);
```

Add product-specific assertions for the other criteria to the same suite. Their outcomes depend on actual focus state, the controls used in a workflow or how pages relate to each other, so a generic axe scan gives limited evidence for them. Keep manual checks for the parts the suite cannot observe.
