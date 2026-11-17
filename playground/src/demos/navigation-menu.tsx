import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';

const DOCUMENTATION_LINKS = [
    {
        title: 'Installation',
        description: 'Install and upgrade a self-hosted app.',
    },
    { title: 'REST API', description: 'Endpoints, API keys and scopes.' },
    { title: 'Realtime', description: 'Reverb channels and presence.' },
];

/** Horizontal navigation with a dropdown panel, for public and docs pages. */
export default function NavigationMenuDemo() {
    return (
        <NavigationMenu>
            <NavigationMenuList>
                <NavigationMenuItem>
                    <NavigationMenuTrigger>Documentation</NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <ul className="grid w-80 gap-1">
                            {DOCUMENTATION_LINKS.map((documentationLink) => (
                                <li key={documentationLink.title}>
                                    <NavigationMenuLink href="#/">
                                        <span className="text-sm font-medium">
                                            {documentationLink.title}
                                        </span>
                                        <span className="text-sm text-muted-foreground">
                                            {documentationLink.description}
                                        </span>
                                    </NavigationMenuLink>
                                </li>
                            ))}
                        </ul>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                    <NavigationMenuLink
                        href="#/"
                        className={navigationMenuTriggerStyle()}
                    >
                        Pricing
                    </NavigationMenuLink>
                </NavigationMenuItem>
            </NavigationMenuList>
        </NavigationMenu>
    );
}
