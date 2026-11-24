import { size, disabled, readOnly, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { Calendar } from '../../prototypes/date-picker/date-picker.proto.js';
import { previewProps } from '../preview-code.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  CalendarAnatomy,
  CalendarSizes,
  DayStates,
  RangeGeometry,
  CalendarAvailability,
  CalendarNavigation,
  ConsecutiveMonths,
} from './calendar.examples.js';
import { SelectedPeriod } from './selected-period.js';
import periodSource from './selected-period.tsx?raw';

export default defineComponent({
  id: 'calendar',
  title: 'Calendar',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary: 'Choose a single day or a continuous period in a month grid or full-year overview.',
  componentName: 'Calendar',
  props: {
    size,
    disabled,
    readOnly,
    mode: choice(
      'Interaction',
      'Select one date or a complete period.',
      ['single', 'range'],
      'single',
    ),
    layout: choice('Geometry', 'Month grid or full-year overview.', ['months', 'year'], 'months'),
    numberOfMonths: {
      kind: 'number',
      group: 'Geometry',
      default: 1,
      examples: [1, 2, 3],
      publicType: 'number',
      description: 'Number of visible months in the month layout, from one to twelve.',
    },
    showFeedback: toggle('Content', 'Show calendar feedback below the dates.', true),
    onSelect: eventProp(
      'Receives the selected calendar date.',
      '(date) => console.log(date)',
      '(date: string) => void',
    ),
    onRangeChange: eventProp(
      'Receives both dates when an available period is complete.',
      '(range) => console.log(range)',
      '(range: readonly [string, string]) => void',
    ),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { layout: 'year' },
      affects: ['numberOfMonths'],
      reason: 'The year overview always renders twelve months.',
    },
  ],
  render: withOverlaySurface(
    ({ values, ctx }) => (
      <Calendar
        {...values}
        {...ctx.subject}
        defaultValue="2026-09-16"
        onSelect={ctx.action('onSelect')}
        onRangeChange={ctx.action('onRangeChange')}
      />
    ),
    'border-box',
  ),
  code: (values) => {
    const props = previewProps(values, {
      size: 'm',
      disabled: false,
      readOnly: false,
      mode: 'single',
      layout: 'months',
      numberOfMonths: 1,
      showFeedback: true,
    });
    return `import { Calendar } from './prototypes/date-picker/date-picker.proto.js';
import '@docouno/unica/styles.css';

export function SeptemberCalendar() {
  return <Calendar defaultValue="2026-09-16"${props} onSelect={(date) => console.log(date)} onRangeChange={(range) => console.log(range)} />;
}`;
  },
  states: [
    {
      id: 'sizes',
      rows: 'size',
      group: 'mode',
      title: 'Day sizes and selection modes',
      caption:
        'Seven day columns use 32, 40 or 44px at their natural widths. Single selection starts on September 16. Choose two dates to complete a range. Touch targets use the spacious density.',
    },
  ],
  cases: [
    {
      id: 'day-targets',
      title: 'Full weeks at each size',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The three independent months sit beside one another when space permits, then wrap as complete calendars. Select a day at either end of a week to compare compact and touch targets.',
      render: withOverlaySurface(CalendarSizes, 'content-box'),
    },
    {
      id: 'anatomy',
      title: 'One month without an outer frame',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'The selected day starts on September 14. September 16 marks today. Navigate to another month and choose a date.',
      render: withOverlaySurface(CalendarAnatomy, 'border-box'),
    },
    {
      id: 'day-states',
      title: 'Day state hierarchy',
      mode: 'pinned',
      kind: 'behavior',
      caption:
        'September 8 shows hover, 9 press and 10 keyboard focus. The 16th combines selection, today and press; the 17th combines unavailability and focus. Dots mark events.',
      render: withOverlaySurface(DayStates, 'border-box'),
    },
    {
      id: 'ranges',
      title: 'Range geometry',
      mode: 'live',
      kind: 'behavior',
      surface: 'overlay',
      reset: true,
      caption:
        'The first three panels pin the accepted period, a proposed replacement and a single-day range. In the last panel, choose two dates and compare the pending interval with the accepted fill.',
      render: RangeGeometry,
    },
    {
      id: 'availability',
      title: 'Availability and boundaries',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Choose 2–10 days within September 7–25, avoiding the unavailable 18th–20th. The pinned examples keep their accepted dates. Browse away from a fully unavailable month or explore a read-only selection.',
      render: withOverlaySurface(CalendarAvailability, 'border-box'),
    },
    {
      id: 'navigation',
      title: 'Choose a month or year',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Choose a month within the year or a year while keeping the month. Either returns to the day grid. The German calendar starts each week on Sunday.',
      render: withOverlaySurface(CalendarNavigation, 'border-box'),
    },
    {
      id: 'multiple',
      title: 'Consecutive months',
      mode: 'live',
      kind: 'behavior',
      reset: true,
      caption:
        'Choose a period across September and October. The selected dates stay visible while you choose a replacement, and both month grids share the new result.',
      render: withOverlaySurface(ConsecutiveMonths, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'year',
      title: 'Year overview',
      mode: 'live',
      reset: true,
      caption:
        'Choose both ends of a period across the twelve compact months. The selected period changes when you confirm the second date. Each month keeps six weeks as the year reflows.',
      render: withOverlaySurface(
        ({ ctx }) => <SelectedPeriod calendarProps={ctx.subject} />,
        'border-box',
      ),
      code: periodSource.replace('../../prototypes/', './prototypes/'),
    },
  ],
});
