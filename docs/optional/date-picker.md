# Date and date-time picker

Use the same editable field and calendar across browsers, with the app's locale and a stable format for forms and filters.

**Use when** selecting a dismissal date, a maintenance window endpoint, an AI price effective date, an activity-log filter, or an API key expiry.
**Skip when** picking a connected range in one control. Use `date-range-picker` for that flow.

**Registry** `date-picker` via `npx shadcn add @qiick/date-picker`. **Playground** `#/date-picker`, `#/date-picker/dark`, and `#/date-picker/dark/high-contrast`.

## Rules

- In a form, use `DatePicker` as a field with its label above the input and calendar button on the right. Pass the server's validation error as `error`. For filters, place the picker among the controls on the left of the toolbar. Give each bound its own label and use `isLabelHidden` if the toolbar already makes the labels visually redundant.
- The component is controlled. Pass `value` and update it in `onChange`, including when the form is reset. Use `YYYY-MM-DD` for dates, `YYYY-MM-DDTHH:mm` with `hasTime`, and `null` for empty. Format persisted values before passing them in. Pass `name` for an Inertia `<Form>` or ordinary form to submit the controlled value from a hidden input. An empty field submits an empty string, which Laravel's usual empty-string middleware converts to `null`. With `useForm`, connect `onChange` to `setData`.
- The picker commits valid typed edits and calendar selections. Blurring an invalid edit shows the inline error. For qiick's `noValidate` forms, check `event.currentTarget.checkValidity()` in the submit handler and proceed only when it returns true. For Inertia's `<Form>`, use `onSubmitCapture` and call both `preventDefault()` and `stopPropagation()` when invalid. Apply the same check before a programmatic submit. This surfaces the inline error and protects the previous value while a draft is invalid. Keep format, authorization, and bounds validation on the server.
- `min` and `max` are optional inclusive limits in the same wire format as `value`. The calendar disables days outside those limits. In date-time mode, calendar selection keeps the saved time when possible, starts at midnight for an empty field, and clamps it to the day's allowed time at either bound. The editable field accepts a valid Gregorian date with a four-digit year and, in date-time mode, a 24-hour time to the minute.
- For date-times, pass the signed-in user's stored IANA `timeZone` by default, or the zone selected for a maintenance window. If omitted, the calendar uses the device time zone for today. The field displays and returns the entered **wall time** unchanged. Treat the IANA zone as separate form data or obtain it from the user's profile on the server. A zone change keeps the wall time and changes its interpretation.
- For actions that schedule an instant, resolve the value and IANA zone together on the server. Reject skipped times such as `2026-03-29T02:30` in `Europe/Rome`. For a repeated time such as `2026-10-25T02:30` there, ask for an offset or apply an explicit product policy before persisting the instant. The picker's format and bounds checks operate on wall time, so either case can be typed or selected.
- Align any future change to `DateRangePicker`'s native time inputs with this pattern's labelled 24-hour text entry, app locale, and explicit time zone. Carry over regional English support (`en-GB` starts the week on Monday) and preserve the range picker's two-day selection and Apply behavior.

## Keyboard and accessibility

Type directly in the labelled input or Tab to the calendar button and press Enter or Space. Focus moves to the selected day, today, or the first available day in the displayed month. Use arrow keys for days and weeks, Home and End for the week boundaries, and Page Up and Page Down for months. Enter or Space chooses the focused day. Escape and Close return focus to the calendar button, as do selecting and clearing a value. Clear is available in the popover, and erasing the text also clears the field. The live region announces the chosen value or that it was cleared.

For a browser check, open the playground in light and dark mode, navigate the calendar using the keyboard, verify Escape returns focus, type a time, and enter a value outside the date-time bounds. Check visible focus with high contrast enabled.

## i18n

Merge `datePicker.*` from the registry's English, Italian and German locale files. The app translates the field label and server error. The app language controls the order and separators of the numeric date, the calendar labels, and the first day of the week. Time entry uses `HH:mm` in every locale.
