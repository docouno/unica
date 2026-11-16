import type { ReactElement } from 'react';
import type * as DatePickerFamily from './date-picker.components.proto.js';
import type { CalendarProps } from './calendar.proto.js';
import type {
  DatePickerProps,
  DateRangePickerProps,
  DatePickerPanelProps,
} from './date-picker.components.proto.js';
export type { CalendarProps } from './calendar.proto.js';
export type {
  DatePickerProps,
  DateRangePickerProps,
  DatePickerPanelProps,
} from './date-picker.components.proto.js';

// Resolve the family before the first render, using the workbench's example-chunk pattern.
const family: typeof DatePickerFamily = await import('./date-picker.components.proto.js');
export function Calendar(props: CalendarProps): ReactElement {
  return <family.Calendar {...props} />;
}
export function DatePicker(props: DatePickerProps): ReactElement {
  return <family.DatePicker {...props} />;
}
export function DateRangePicker(props: DateRangePickerProps): ReactElement {
  return <family.DateRangePicker {...props} />;
}
export function DatePickerPanel(props: DatePickerPanelProps): ReactElement {
  return <family.DatePickerPanel {...props} />;
}
