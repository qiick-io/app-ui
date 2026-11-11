import { Rows3, Rows4 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

/**
 * Table density (optional pattern `table-density`,
 * docs/optional/table-density.md).
 *
 * Long tables read better compact for people who scan many rows a day, and
 * comfortable for everyone else, so density is a per-user preference. The
 * theme does the work (`[data-density='compact']` tightens table rows); this
 * is the segmented control that changes it, for Appearance settings and,
 * optionally, a table toolbar.
 */

export type TableDensity = 'comfortable' | 'compact';

/** The attribute the theme reads; set it on <html> from the user's preference. */
export const TABLE_DENSITY_ATTRIBUTE = 'data-density';

/**
 * Applies a density to the document, as the app does at boot and after the
 * user changes it (persisting it is the app's job).
 */
export function applyTableDensity(density: TableDensity): void {
    document.documentElement.setAttribute(TABLE_DENSITY_ATTRIBUTE, density);
}

export function TableDensityToggle({
    value,
    onChange,
}: {
    value: TableDensity;
    onChange: (density: TableDensity) => void;
}) {
    const { t } = useTranslation();

    return (
        <ToggleGroup
            type="single"
            variant="outline"
            value={value}
            aria-label={t('tableDensity.label')}
            onValueChange={(nextValue) => {
                // Radix sends '' when the active item is clicked again.
                if (nextValue === 'comfortable' || nextValue === 'compact') {
                    onChange(nextValue);
                }
            }}
        >
            <ToggleGroupItem value="comfortable">
                <Rows3 aria-hidden="true" className="size-4" />
                {t('tableDensity.comfortable')}
            </ToggleGroupItem>
            <ToggleGroupItem value="compact">
                <Rows4 aria-hidden="true" className="size-4" />
                {t('tableDensity.compact')}
            </ToggleGroupItem>
        </ToggleGroup>
    );
}
