const SCREENS = ['users', 'settings', 'assistant', 'chat'];

/** The shell needs the whole viewport, so it is shown on the screens. */
export default function AppShellDemo() {
    return (
        <p className="text-sm">
            Full-page screens:{' '}
            {SCREENS.map((screen, index) => (
                <span key={screen}>
                    {index > 0 ? ', ' : null}
                    <a className="text-primary underline" href={`#/${screen}`}>
                        {screen}
                    </a>
                </span>
            ))}
            .
        </p>
    );
}
