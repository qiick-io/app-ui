import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from '@/components/ui/carousel';

/** Carousel, as the media lightbox uses it. */
export default function CarouselDemo() {
    return (
        <Carousel className="mx-12 w-56">
            <CarouselContent>
                {[1, 2, 3].map((index) => (
                    <CarouselItem key={index}>
                        <div className="flex aspect-square items-center justify-center rounded-md bg-muted text-2xl font-semibold">
                            {index}
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    );
}
