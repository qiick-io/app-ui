import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '@/components/ui/accordion';

/** Accordion groups, as a collection form uses them. */
export default function AccordionDemo() {
    return (
        <Accordion type="single" collapsible className="max-w-md">
            <AccordionItem value="seo">
                <AccordionTrigger>SEO</AccordionTrigger>
                <AccordionContent>
                    Meta title, description and image.
                </AccordionContent>
            </AccordionItem>
            <AccordionItem value="publishing">
                <AccordionTrigger>Publishing</AccordionTrigger>
                <AccordionContent>
                    Status, schedule and author.
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
}
