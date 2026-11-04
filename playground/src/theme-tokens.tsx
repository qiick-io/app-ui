const SWATCHES = [
    ['background', 'foreground'],
    ['card', 'card-foreground'],
    ['popover', 'popover-foreground'],
    ['primary', 'primary-foreground'],
    ['primary-hover', 'primary-foreground'],
    ['secondary', 'secondary-foreground'],
    ['muted', 'muted-foreground'],
    ['accent', 'accent-foreground'],
    ['destructive', 'destructive-foreground'],
    ['success', 'success-foreground'],
    ['warning', 'warning-foreground'],
    ['info', 'info-foreground'],
    ['ai', 'ai-foreground'],
    ['ai-bg', 'ai-text'],
    ['sidebar', 'sidebar-foreground'],
    ['sidebar-accent', 'sidebar-accent-foreground'],
] as const;

const CONTROL_SIZES = [
    ['control-sm', '24px'],
    ['control', '32px'],
    ['control-lg', '40px'],
] as const;

/**
 * Colour pairs, the focus ring, chart colours and the control-size scale of
 * the qiick theme, read straight from the CSS variables.
 */
export function ThemeTokens() {
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SWATCHES.map(([background, foreground]) => (
                    <div
                        key={background}
                        className="rounded-md border p-3 text-xs"
                        style={{
                            background: `var(--${background})`,
                            color: `var(--${foreground})`,
                        }}
                    >
                        <div className="font-medium">{background}</div>
                        <div>{foreground}</div>
                    </div>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="rounded-md px-2 py-1 outline-2 outline-offset-2 outline-ring">
                    ring
                </span>
                <span className="rounded-md border border-input px-2 py-1">
                    input
                </span>
                {[1, 2, 3, 4, 5].map((chart) => (
                    <span
                        key={chart}
                        className="size-6 rounded-sm"
                        style={{ background: `var(--chart-${chart})` }}
                        title={`chart-${chart}`}
                    />
                ))}
            </div>
            <div className="flex items-end gap-3 text-xs text-muted-foreground">
                {CONTROL_SIZES.map(([key, size]) => (
                    <div key={key} className="flex flex-col items-center gap-1">
                        <div
                            className="w-16 rounded-md border border-input"
                            style={{ height: `var(--spacing-${key})` }}
                        />
                        {key} · {size}
                    </div>
                ))}
            </div>
        </div>
    );
}
