import { PackageCheck } from 'lucide-react';
import { Timeline } from '@/components/timeline';
import type { TimelineStep } from '@/components/timeline';

const BLOCKING_PACKAGES = [
    'inertiajs/inertia-laravel',
    'laravel/ai',
    'laravel/horizon',
    'spatie/laravel-backup',
].map((name) => ({ id: name, label: name }));

const COMPOSER_PATCHES = [
    ['spatie/laravel-activitylog', '5.1.4', '5.1.5'],
    ['laravel/pint', 'v1.32.2', 'v1.32.3'],
    ['laravel/framework', '13.4.1', '13.4.6'],
    ['pestphp/pest', '4.2.0', '4.2.3'],
    ['larastan/larastan', '3.7.1', '3.7.2'],
    ['spatie/laravel-permission', '7.0.1', '7.0.4'],
    ['laravel/sanctum', '5.1.0', '5.1.2'],
    ['guzzlehttp/guzzle', '7.10.0', '7.10.1'],
    ['league/flysystem-aws-s3-v3', '3.30.0', '3.30.2'],
    ['predis/predis', '3.2.0', '3.2.1'],
    ['laravel/reverb', '1.6.2', '1.6.5'],
].map(([name, previousVersion, nextVersion]) => ({
    id: name,
    label: name,
    previousValue: previousVersion,
    value: nextVersion,
}));

const NPM_PATCHES = [
    ['react', '19.2.0', '19.2.1'],
    ['@inertiajs/react', '3.1.0', '3.1.2'],
    ['vite', '7.3.1', '7.3.2'],
].map(([name, previousVersion, nextVersion]) => ({
    id: name,
    label: name,
    previousValue: previousVersion,
    value: nextVersion,
}));

const UPGRADE_PLAN_STEPS: TimelineStep[] = [
    {
        id: 'php',
        title: 'Run PHP 8.5 in production',
        description: 'Already on 8.5.2 since the last deploy.',
        status: 'done',
    },
    {
        id: 'composer-patches',
        title: 'Update Composer packages to the latest patch',
        description: 'Patch releases only: no code changes expected.',
        status: 'current',
        chips: COMPOSER_PATCHES,
        count: COMPOSER_PATCHES.length,
        countLabel: `${COMPOSER_PATCHES.length} packages`,
    },
    {
        id: 'npm-patches',
        title: 'Update npm packages to the latest patch',
        status: 'pending',
        statusLabel: 'Ready',
        chips: NPM_PATCHES,
        count: NPM_PATCHES.length,
        countLabel: `${NPM_PATCHES.length} packages`,
    },
    {
        id: 'abandoned',
        title: 'Replace an abandoned package',
        description:
            'Composer marks it abandoned and suggests symfony/mailer instead.',
        status: 'warning',
        chips: [
            {
                id: 'swiftmailer/swiftmailer',
                label: 'swiftmailer/swiftmailer',
                value: '6.3.0',
            },
        ],
    },
    {
        id: 'laravel-14',
        title: 'Upgrade to Laravel 14',
        description:
            'No release of these packages supports Laravel 14 yet: watch them, replace them or fork them.',
        status: 'blocked',
        icon: PackageCheck,
        chips: BLOCKING_PACKAGES,
        count: BLOCKING_PACKAGES.length,
        countLabel: `${BLOCKING_PACKAGES.length} blocking packages`,
    },
];

const SETUP_STEPS: TimelineStep[] = [
    { id: 'key', title: 'Create an API key', status: 'done' },
    { id: 'install', title: 'Install the agent', status: 'current' },
    { id: 'report', title: 'Send the first report', status: 'pending' },
];

/** An upgrade plan at the default density, and a short checklist compact. */
export default function TimelineDemo() {
    return (
        <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
            <Timeline aria-label="Upgrade plan" steps={UPGRADE_PLAN_STEPS} />
            <Timeline
                aria-label="Setup"
                density="compact"
                steps={SETUP_STEPS}
            />
        </div>
    );
}
