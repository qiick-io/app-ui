import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

export default function SliderDemo() {
    return (
        <div className="flex w-64 flex-col gap-6">
            <div className="flex flex-col gap-3">
                <Label id="demo-slider-volume">Volume</Label>
                <Slider
                    aria-labelledby="demo-slider-volume"
                    defaultValue={[60]}
                    max={100}
                    step={1}
                />
            </div>
            <div className="flex flex-col gap-3">
                <Label id="demo-slider-range">File size (MB)</Label>
                <Slider
                    aria-labelledby="demo-slider-range"
                    defaultValue={[5, 40]}
                    max={100}
                    step={5}
                />
            </div>
        </div>
    );
}
