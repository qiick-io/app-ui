import { ThemeTokens } from '../theme-tokens';

/** The preset sets `:root` / `.dark`, so it is applied with the Preset switch above. */
export default function ThemeBlueDemo() {
    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
                Pick "blue" in the Preset switch to apply it.
            </p>
            <ThemeTokens />
        </div>
    );
}
