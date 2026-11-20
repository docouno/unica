import { size, disabled, readOnly, choice, toggle, eventProp } from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { Calendar, DatePickerPanel } from '../../prototypes/date-picker/date-picker.proto.js';
import '../../prototypes/date-picker/date-picker.css';
import { DateStudy } from '../../prototypes/date-picker/date-study.proto.js';

export default defineComponent({
  id: 'calendar',
  title: 'Calendar',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'A quiet temporal grid. Clear selection, continuous ranges, and the same anatomy from one month to a year.',
  componentName: 'Calendar',
  props: {
    size,
    disabled,
    readOnly,
    mode: choice('Selection', 'Choose a date or a period.', ['single', 'range'], 'single'),
    layout: choice('Geometry', 'Compact month or year overview.', ['months', 'year'], 'months'),
    numberOfMonths: {
      kind: 'number',
      group: 'Geometry',
      default: 1,
      examples: [1, 2, 3],
      description: 'Number of visible months in the month layout.',
    },
    showFeedback: toggle('Selection', 'Show calendar feedback below the dates.', true),
    onSelect: eventProp('Reports an individual selected date.', 'handleSelect'),
    onRangeChange: eventProp('Reports the start and end dates.', 'handleRangeChange'),
  },
  constraints: [
    {
      kind: 'precedence',
      when: { layout: 'year' },
      affects: ['numberOfMonths'],
      reason: 'The year overview always renders twelve months.',
    },
  ],
  render: ({ values, ctx }) => (
    <Calendar
      {...values}
      {...ctx.subject}
      defaultValue="2026-09-16"
      onSelect={ctx.action('onSelect')}
      onRangeChange={ctx.action('onRangeChange')}
    />
  ),
  code: (_values, attributes) => `<Calendar defaultValue="2026-09-16"${attributes} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'mode',
      title: 'S / M / L',
      caption:
        '32 / 40 / 44px cells. A compact overview, a standard picker, and a spacious standalone calendar. Touch targets expand to 44px.',
      reference: () => (
        <div className="date-study-grid-proto date-study-grid-sizes-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <DateStudy key={size} label={`${size.toUpperCase()} · single date`}>
              <Calendar size={size} defaultValue="2026-09-16" />
            </DateStudy>
          ))}
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'One month · no outer frame',
      caption:
        'Live month and year navigation. September 16 is the reference today; selection and today remain separate.',
      kind: 'behavior',
      render: () => (
        <DateStudy label="Single selection · M">
          <Calendar defaultValue="2026-09-14" />
        </DateStudy>
      ),
    },
    {
      id: 'day-states',
      title: 'State hierarchy',
      caption:
        'Pinned: 8 hover, 9 pressed, 10 keyboard focus, 16 selected + today + pressed, 17 unavailable + focus. Event dots are optional information, never availability.',
      kind: 'behavior',
      render: () => (
        <DateStudy
          label="Today, selection, focus & availability"
          note="Unavailable dates are crossed out; their reason is revealed on hover or focus. The focus contour never becomes the selected fill."
        >
          <Calendar
            value="2026-09-16"
            unavailable={['2026-09-17', '2026-09-18']}
            indicators={['2026-09-11', '2026-09-16', '2026-09-23']}
            previewDates={{
              '2026-09-08': 'hover',
              '2026-09-09': 'active',
              '2026-09-10': 'focus',
              '2026-09-17': 'focus',
              '2026-09-16': 'active',
            }}
          />
        </DateStudy>
      ),
    },
    {
      id: 'ranges',
      title: 'Range geometry',
      caption:
        'Accepted dates keep their fills while you choose. Softer accents show the proposed changes and the feedback line gives the proposed duration.',
      surface: 'overlay',
      overlayStage: true,
      kind: 'behavior',
      render: () => (
        <div className="date-study-stack-proto date-study-overlay-stack-proto">
          <DateStudy label="Accepted period · hover and press">
            <DatePickerPanel>
              <Calendar
                mode="range"
                range={['2026-09-11', '2026-09-23']}
                previewDates={{
                  '2026-09-15': 'hover',
                  '2026-09-16': 'active',
                  '2026-09-23': 'hover',
                }}
              />
            </DatePickerPanel>
          </DateStudy>
          <DateStudy
            label="Preview · start chosen, end under pointer"
            note="Pinned. Use the live calendar below to choose a range."
          >
            <DatePickerPanel>
              <Calendar
                mode="range"
                previewAnchor="2026-09-14"
                previewCandidate="2026-09-19"
                previewRange={['2026-09-14', '2026-09-19']}
              />
            </DatePickerPanel>
          </DateStudy>
          <DateStudy label="One day · inclusive range">
            <DatePickerPanel>
              <Calendar mode="range" range={['2026-09-16', '2026-09-16']} />
            </DatePickerPanel>
          </DateStudy>
          <DateStudy label="Live · choose two dates">
            <DatePickerPanel>
              <Calendar mode="range" />
            </DatePickerPanel>
          </DateStudy>
        </div>
      ),
    },
    {
      id: 'availability',
      title: 'Availability & boundaries',
      caption:
        'No dates before September 7 or after September 25. September 18–20 is unavailable. A pending range cannot cross these dates.',
      kind: 'behavior',
      render: () => (
        <div className="date-study-stack-proto">
          <DateStudy label="Live · restricted selection">
            <Calendar
              mode="range"
              min="2026-09-07"
              max="2026-09-25"
              unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
              minRangeDays={2}
              maxRangeDays={10}
            />
          </DateStudy>
          <DateStudy
            label="Blocked end date · pinned"
            note="The accepted period stays visible. The new start is September 14. Ending on the 22nd would cross unavailable days."
          >
            <Calendar
              mode="range"
              range={['2026-09-08', '2026-09-11']}
              previewAnchor="2026-09-14"
              previewCandidate="2026-09-22"
              previewRange={['2026-09-14', '2026-09-22']}
              unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
              previewDates={{ '2026-09-22': 'hover' }}
            />
          </DateStudy>
          <DateStudy
            label="No availability this month"
            note="Keep the month recognizable and let the user browse to another period."
          >
            <Calendar
              unavailable={Array.from(
                { length: 30 },
                (_, index) => `2026-09-${String(index + 1).padStart(2, '0')}`,
              )}
            />
          </DateStudy>
          <DateStudy
            label="Selected date becomes unavailable"
            note="Retain the recognizable selection; explain the conflict rather than silently clearing it."
          >
            <Calendar value="2026-09-16" unavailable={['2026-09-16']} />
          </DateStudy>
          <DateStudy label="Read only · navigation remains available">
            <Calendar readOnly defaultValue="2026-09-16" />
          </DateStudy>
          <DateStudy label="Disabled · selection retained">
            <Calendar disabled defaultValue="2026-09-16" />
          </DateStudy>
        </div>
      ),
    },
    {
      id: 'navigation',
      title: 'Choose a month or year',
      caption:
        'Select the month to change it within the current year. Select the year to change it while keeping the current month. Either choice returns directly to the days.',
      kind: 'behavior',
      render: () => (
        <div className="date-study-stack-proto">
          <DateStudy label="Month selector · 3 columns">
            <Calendar initialView="months" defaultValue="2026-09-14" />
          </DateStudy>
          <DateStudy label="Year selector · 12-year window">
            <Calendar initialView="years" defaultValue="2026-09-14" />
          </DateStudy>
          <DateStudy
            label="Localized · Sunday first"
            note="German month labels; the week starts on Sunday. The same grid also mirrors under the Workbench RTL control."
          >
            <Calendar locale="de-DE" weekStartsOn={0} month="2026-12" defaultValue="2026-12-24" />
          </DateStudy>
        </div>
      ),
    },
    {
      id: 'multiple',
      title: 'Consecutive months',
      caption:
        'One selection across September and October. Columns reflow with the container; adjacent dates are not duplicated.',
      kind: 'behavior',
      render: () => (
        <Calendar mode="range" numberOfMonths={2} range={['2026-09-25', '2026-10-07']} />
      ),
    },
  ],
  usage: [
    {
      id: 'year',
      title: 'Year overview',
      caption:
        'All twelve months use the same six-week grid. Compact S density; columns reflow without horizontal scrolling.',
      code: `<Calendar
  size="s"
  layout="year"
  month="2026-01"
  mode="range"
  range={['2026-09-25', '2026-10-07']}
/>`,
      render: () => (
        <Calendar
          size="s"
          layout="year"
          month="2026-01"
          mode="range"
          range={['2026-09-25', '2026-10-07']}
        />
      ),
    },
  ],
});
