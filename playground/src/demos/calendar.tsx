import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';

/** Same shape as react-day-picker's `DateRange`. */
type DateRange = { from: Date | undefined; to?: Date };

export default function CalendarDemo() {
    const [day, setDay] = useState<Date | undefined>(new Date());
    const [range, setRange] = useState<DateRange | undefined>();

    return (
        <div className="flex flex-wrap gap-6">
            <Calendar
                mode="single"
                selected={day}
                onSelect={setDay}
                className="rounded-lg border"
            />
            {/* Range: start and end are joined by one band. */}
            <Calendar
                mode="range"
                selected={range}
                onSelect={setRange}
                numberOfMonths={2}
                className="rounded-lg border"
            />
        </div>
    );
}
