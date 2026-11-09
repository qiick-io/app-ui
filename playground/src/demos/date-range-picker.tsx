import { useState } from 'react';
import { DateRangePicker } from '@/components/admin/date-range-picker';
import type { DateRangeValue } from '@/components/admin/date-range-picker';

export default function DateRangePickerDemo() {
    const [dates, setDates] = useState<DateRangeValue>({ from: '', to: '' });
    const [span, setSpan] = useState<DateRangeValue>({ from: '', to: '' });
    const today = new Date();

    return (
        <div className="grid max-w-md gap-4">
            {/* Dates only (externa-core): commits on the second day. */}
            <DateRangePicker
                value={dates}
                onChange={setDates}
                placeholder="Any date"
                clearLabel="Clear"
                aria-label="Created between"
            />
            {/* With times, up to today: commits with Apply. */}
            <DateRangePicker
                value={span}
                onChange={setSpan}
                placeholder="Custom range"
                clearLabel="Clear"
                aria-label="Time range"
                withTime
                max={today}
            />
        </div>
    );
}
