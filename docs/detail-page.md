# Detail page

**Registry:** `page-layout`, `page-header`, `tabs`, `badge`, `button`, `dropdown-menu`, `card`, `sheet`.

**Copy from externa-core:** record header and views `pages/collections/items/form.tsx` (header actions, status `Badge`, overflow `DropdownMenu`, the Activity tab's `<dl>`); side-panel detail `components/admin/files/file-detail-panel.tsx` in `file-detail-drawer.tsx`; layout `layouts/app-layout.tsx` (`headerActions`), `components/layout/page-layout.tsx`.

externa-core has no read-only "show" screen of its own: a record opens on its edit page or in a side panel. A product that needs one composes it from the parts below, nothing else.

## Layout

- **Header** (`AppLayout` breadcrumbs + `PageLayout`): the record's name as the last breadcrumb, a status `Badge` next to it (`success`, `warning`, `destructive`, `secondary`, `muted`: status only), the primary action far right in `headerActions`, everything else in a `⋯` `DropdownMenu` (destructive items last, after a separator, confirmed with `ConfirmDestructiveDialog`).
- **Views** of the record (Overview, Activity, Settings, …) are line `Tabs` under the header, each with its own URL (`docs/page.md`).
- **Fields** are a description list, two columns from `sm`:

```tsx
<dl className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2">
    <div>
        <dt className="font-medium text-foreground">{t('items.createdBy')}</dt>
        <dd>{item.created_by.name}</dd>
    </div>
</dl>
```

- Long text, related lists and charts go in `Card`s below the fields; empty sections show the empty state of `docs/empty-states.md`, never a blank card.
- **Side panel** instead of a page when the record is looked at from a list without leaving it (files, notifications): a right `Sheet` with the same `dl` and section headings, actions at the top.

## Server side

One `show` (or `edit`) controller method, a `*Resource` with exactly the fields the page renders, and the user's abilities for the record (`can.update`, `can.delete`) computed from the policy, so the UI hides actions without guessing.
