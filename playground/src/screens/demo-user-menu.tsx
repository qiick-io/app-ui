import { useState } from 'react';
import { NavUser } from '@/components/nav-user';
import { UserMenuContent } from '@/components/user-menu-content';
import type { UserMenuAppearance } from '@/components/user-menu-content';

const USER = {
    id: 7,
    name: 'Elena Marchetti',
    email: 'elena@example.com',
};

/** The sidebar user menu with every section, on local state. */
export function DemoUserMenu() {
    const [locale, setLocale] = useState('en');
    const [appearance, setAppearance] = useState<UserMenuAppearance>('system');
    const [highContrast, setHighContrast] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    return (
        <NavUser user={USER} connectionState="connected">
            <UserMenuContent
                user={USER}
                settingsHref="/settings/profile"
                logoutHref="/logout"
                locale={{
                    current: locale,
                    options: { en: 'English', it: 'Italiano', de: 'Deutsch' },
                    onChange: setLocale,
                }}
                appearance={{ value: appearance, onChange: setAppearance }}
                accessibility={{
                    highContrast,
                    reduceMotion,
                    onToggleHighContrast: () =>
                        setHighContrast((value) => !value),
                    onToggleReduceMotion: () =>
                        setReduceMotion((value) => !value),
                }}
            />
        </NavUser>
    );
}
