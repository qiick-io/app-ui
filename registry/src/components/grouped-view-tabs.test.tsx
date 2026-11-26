import { cleanup, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import type { ReactNode } from 'react';
import { initReactI18next } from 'react-i18next';
import { afterEach, beforeAll, expect, it, vi } from 'vitest';
import { GroupedViewTabs } from '@/components/grouped-view-tabs';
import enLocale from '../../locales/en.json';

vi.mock('@inertiajs/react', () => ({
    Link: ({ href, children }: { href: string; children: ReactNode }) => (
        <a href={href}>{children}</a>
    ),
    router: { visit: vi.fn() },
}));

beforeAll(async () => {
    await i18n.use(initReactI18next).init({
        lng: 'en',
        resources: { en: { translation: enLocale } },
        interpolation: { escapeValue: false },
    });
});

afterEach(cleanup);

const groups = [
    {
        id: 'overview',
        label: 'Overview',
        views: [{ id: 'overview', label: 'Overview', href: '/overview' }],
    },
    {
        id: 'issues',
        label: 'Issues',
        views: [
            {
                id: 'findings',
                label: 'Findings',
                href: '/findings',
                count: 46,
                severity: 'warning' as const,
            },
            {
                id: 'exceptions',
                label: 'Exceptions',
                href: '/exceptions',
                count: 3,
                severity: 'critical' as const,
            },
        ],
    },
];

it('shows the open view count on a group trigger that names that view, not the group sum', () => {
    render(
        <GroupedViewTabs
            groups={groups}
            activeViewId="findings"
            ariaLabel="Project views"
            variant="sub-menu"
        />,
    );

    const trigger = screen.getByRole('tab', { name: /Issues: Findings/ });

    expect(trigger.textContent).toContain('46');
    expect(trigger.textContent).not.toContain('49');
    expect(trigger.textContent).not.toContain('Critical');
});

it('keeps the sum and the worst severity on a group trigger whose views are not open', () => {
    render(
        <GroupedViewTabs
            groups={groups}
            activeViewId="overview"
            ariaLabel="Project views"
            variant="sub-menu"
        />,
    );

    const trigger = screen.getByRole('tab', { name: /^Issues/ });

    expect(trigger.textContent).toContain('49');
});
