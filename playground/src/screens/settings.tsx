import { Bug, Info, KeyRound, Palette, Shield, User } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { SettingsFormActions } from '@/components/settings-form-actions';
import {
    Field,
    FieldDescription,
    FieldGroup,
    FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Textarea } from '@/components/ui/textarea';
import { DemoShell } from './demo-shell';

const NAV: Array<[string, Array<[string, LucideIcon]>]> = [
    [
        'Account',
        [
            ['Profile', User],
            ['Security', Shield],
            ['Appearance', Palette],
        ],
    ],
    [
        'Project',
        [
            ['General', Info],
            ['API keys', KeyRound],
        ],
    ],
];

/** externa-core `/settings/project` in the settings layout. */
export function SettingsScreen() {
    const [isSaved, setIsSaved] = useState(false);

    const save = (event: FormEvent) => {
        event.preventDefault();
        setIsSaved(true);
    };

    return (
        <DemoShell
            active="settings"
            breadcrumbs={[
                { title: 'Settings', href: '#/settings' },
                { title: 'General', href: '#/settings' },
            ]}
        >
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-6">
                <div className="mb-8 space-y-0.5">
                    <h2 className="text-xl font-semibold tracking-tight">
                        Settings
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Manage your profile and the project.
                    </p>
                </div>
                <div className="flex min-h-0 flex-1 flex-col lg:flex-row lg:space-x-12">
                    <aside className="w-full max-w-xl shrink-0 lg:w-48">
                        <nav
                            className="flex flex-col gap-2"
                            aria-label="Settings"
                        >
                            {NAV.map(([label, items]) => (
                                <SidebarGroup key={label} className="p-0">
                                    <SidebarGroupLabel>
                                        {label}
                                    </SidebarGroupLabel>
                                    <SidebarMenu>
                                        {items.map(([title, Icon]) => (
                                            <SidebarMenuItem key={title}>
                                                <SidebarMenuButton
                                                    asChild
                                                    size="sm"
                                                    isActive={
                                                        title === 'General'
                                                    }
                                                >
                                                    <a href="#/settings">
                                                        <Icon />
                                                        <span>{title}</span>
                                                    </a>
                                                </SidebarMenuButton>
                                            </SidebarMenuItem>
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroup>
                            ))}
                            <SidebarGroup className="p-0">
                                <SidebarMenu>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton asChild size="sm">
                                            <a href="#/settings">
                                                <Bug />
                                                <span>Report a bug</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                </SidebarMenu>
                            </SidebarGroup>
                        </nav>
                    </aside>
                    <Separator className="my-6 shrink-0 lg:hidden" />
                    <div className="min-h-0 flex-1 overflow-y-auto md:max-w-2xl">
                        <section className="max-w-xl space-y-12 pb-6">
                            <form className="space-y-12" onSubmit={save}>
                                <div className="space-y-6">
                                    <header>
                                        <h3 className="mb-0.5 text-base font-medium">
                                            General
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            Name and description of the project.
                                        </p>
                                    </header>
                                    <FieldGroup className="gap-6">
                                        <Field>
                                            <FieldLabel htmlFor="name">
                                                Project name
                                            </FieldLabel>
                                            <Input
                                                id="name"
                                                defaultValue="Externa"
                                            />
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="description">
                                                Description
                                            </FieldLabel>
                                            <Textarea id="description" />
                                            <FieldDescription>
                                                Shown on the dashboard.
                                            </FieldDescription>
                                        </Field>
                                        <Field>
                                            <FieldLabel htmlFor="url">
                                                Site URL
                                            </FieldLabel>
                                            <Input
                                                id="url"
                                                defaultValue="https://qiick.io"
                                            />
                                        </Field>
                                    </FieldGroup>
                                </div>
                                <SettingsFormActions
                                    processing={false}
                                    recentlySuccessful={isSaved}
                                />
                            </form>
                        </section>
                    </div>
                </div>
            </div>
        </DemoShell>
    );
}
