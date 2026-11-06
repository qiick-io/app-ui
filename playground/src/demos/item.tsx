import { Bell, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Item,
    ItemActions,
    ItemContent,
    ItemDescription,
    ItemGroup,
    ItemMedia,
    ItemTitle,
} from '@/components/ui/item';

/** List rows with media, text and actions (notifications, settings lists, file rows). */
export default function ItemDemo() {
    return (
        <ItemGroup className="max-w-md gap-2">
            <Item variant="outline">
                <ItemMedia variant="icon">
                    <Bell />
                </ItemMedia>
                <ItemContent>
                    <ItemTitle>Invoice approved</ItemTitle>
                    <ItemDescription>
                        Elena approved invoice 2026-114.
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <Button variant="outline" size="sm">
                        Open
                    </Button>
                </ItemActions>
            </Item>
            <Item variant="outline" asChild>
                <a href="#item">
                    <ItemContent>
                        <ItemTitle>Webhook deliveries</ItemTitle>
                        <ItemDescription>Last 24 hours</ItemDescription>
                    </ItemContent>
                    <ItemActions>
                        <ChevronRight className="size-4" />
                    </ItemActions>
                </a>
            </Item>
        </ItemGroup>
    );
}
