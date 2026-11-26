import { useState } from 'react';
import { DatePicker } from '@/components/admin/date-picker';

/** Show an optional date filter and a bounded maintenance date-time. */
export default function DatePickerDemo() {
    const [date, setDate] = useState<string | null>(null);
    const [startsAt, setStartsAt] = useState<string | null>('2026-11-26T09:30');

    return (
        <div className="grid max-w-md gap-4">
            <DatePicker label="Activity from" value={date} onChange={setDate} />
            <DatePicker
                label="Maintenance starts"
                value={startsAt}
                onChange={setStartsAt}
                hasTime
                timeZone="Europe/Rome"
                min="2026-11-26T08:00"
                max="2026-12-07T17:00"
            />
        </div>
    );
}
