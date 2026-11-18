import { defineSpecimen } from '../../workbench/types.js';
import { Calendar, DatePickerPanel } from './date-picker.proto.js';
import './date-picker.css';
import { DateStudy } from './date-study.proto.js';

export default defineSpecimen({
  id: 'calendar',
  title: 'Calendar',
  group: 'Forms',
  summary:
    'A quiet temporal grid. Clear selection, continuous ranges, and the same anatomy from one month to a year.',
  sections: [
    {
      id: 'anatomy',
      title: 'One month · no outer frame',
      kind: 'matrix',
      caption:
        'Live month and year navigation. September 16 is the reference today; selection and today remain separate.',
      render: () => (
        <DateStudy label="Single selection · M">
          <Calendar defaultValue="2026-09-14" />
        </DateStudy>
      ),
    },
    {
      id: 'sizes',
      title: 'S / M / L',
      kind: 'matrix',
      caption:
        '32 / 40 / 44px cells. A compact overview, a standard picker, and a spacious standalone calendar. Touch targets expand to 44px.',
      render: () => (
        <div className="date-study-grid-proto date-study-grid-sizes-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <DateStudy key={size} label={`${size.toUpperCase()} · single date`}>
              <Calendar size={size} defaultValue="2026-09-16" />
            </DateStudy>
          ))}
        </div>
      ),
    },
    {
      id: 'day-states',
      title: 'State hierarchy',
      kind: 'states',
      caption:
        'Pinned: 8 hover, 9 pressed, 10 keyboard focus, 16 selected + today + pressed, 17 unavailable + focus. Event dots are optional information, never availability.',
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
      kind: 'states',
      caption:
        'Solid accepted endpoints, a same-tone hover inside the ribbon, and an outlined proposed endpoint. Reverse selection is ordered; a single-day range has one cap.',
      surface: 'overlay',
      overlayStage: true,
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
            label="Draft · start set, end under pointer"
            note="Pinned preview. Hover and click an empty range below to try the live two-step selection."
          >
            <DatePickerPanel>
              <Calendar
                mode="range"
                range={['2026-09-14', '2026-09-14']}
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
      kind: 'states',
      caption:
        'No dates before September 7 or after September 25. September 18–20 is unavailable. A pending range cannot cross these dates.',
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
            label="Blocked draft · pinned"
            note="A dashed, unfilled path keeps the fixed date visible. The reason appears below the grid."
          >
            <Calendar
              mode="range"
              range={['2026-09-14', '2026-09-14']}
              previewRange={['2026-09-14', '2026-09-22']}
              unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
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
      title: 'Jump to month or year',
      kind: 'context',
      caption:
        'Click the month or year in any live calendar. Both selectors replace the day grid in place; Escape goes back one level.',
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
      kind: 'context',
      caption:
        'One selection across September and October. Columns reflow with the container; adjacent dates are not duplicated.',
      render: () => (
        <Calendar mode="range" numberOfMonths={2} range={['2026-09-25', '2026-10-07']} />
      ),
    },
    {
      id: 'year',
      title: 'Year overview',
      kind: 'context',
      caption:
        'All twelve months use the same six-week grid. Compact S density; columns reflow without horizontal scrolling.',
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
