import {
  size,
  variant,
  status,
  disabled,
  readOnly,
  required,
  clearable,
  loading,
  choice,
  toggle,
  eventProp,
} from '../control-props.js';
import { defineComponent } from '../../workbench/types.js';
import { DateRangePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import { DateStudy } from '../../prototypes/date-picker/date-study.proto.js';

export default defineComponent({
  id: 'date-range-picker',
  title: 'DateRangePicker',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary: 'Enter a period in one field or select two days in one calendar.',
  componentName: 'DateRangePicker',
  props: {
    size,
    variant,
    status,
    disabled,
    readOnly,
    required,
    clearable,
    loading,
    locale: choice(
      'Content',
      'Controls the displayed date format.',
      ['en-GB', 'en-US', 'de-DE', 'ar-SA'],
      'en-GB',
    ),
    allowUnavailableInRange: toggle(
      'Selection',
      'Permit unavailable dates between eligible endpoints.',
    ),
    onValueChange: eventProp('Reports both endpoints of the selected period.', 'handleValueChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading', 'clearable'],
      reason: 'The disabled field suppresses feedback, pending work and clear interaction.',
    },
  ],
  render: ({ values, ctx }) => (
    <DateRangePicker
      {...values}
      subjectAttributes={ctx.subject}
      label="Release window"
      defaultValue={['2026-09-14', '2026-09-23']}
      unavailable={['2026-09-19']}
      onValueChange={ctx.action('onValueChange')}
    />
  ),
  code: (_values, attributes) =>
    `<DateRangePicker
  label="Release window"
  defaultValue={['2026-09-14', '2026-09-23']}
  unavailable={['2026-09-19']}${attributes}
/>`,
  matrixViews: [
    {
      id: 'fields',
      rows: 'size',
      cols: 'variant',
      title: 'One field · two boundaries',
      caption:
        'Default / ghost × S / M / L. A single label, one text input, and one clear action for the entire period.',
      reference: () => (
        <div className="date-study-grid-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <DateStudy key={size} label={`${size.toUpperCase()} · complete period`}>
              <DateRangePicker
                size={size}
                label="Date window"
                defaultValue={['2026-09-14', '2026-09-23']}
                clearable
              />
              <DateRangePicker
                size={size}
                label="Inline date window"
                variant="ghost"
                defaultValue={['2026-09-14', '2026-09-23']}
                clearable
              />
            </DateStudy>
          ))}
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Period & calendar',
      overlayStage: true,
      caption:
        'The panel is kept in flow for material review. Live anchored behavior is available in the Live section.',
      kind: 'behavior',
      render: () => (
        <DateRangePicker
          label="Date window"
          defaultValue={['2026-09-11', '2026-09-23']}
          defaultOpen
          previewInline
          clearable
        />
      ),
    },
    {
      id: 'states',
      title: 'States & correction',
      caption:
        'Semantic feedback is pinned for comparison; use Live for validation recovery. Both dates use one ordinary text input. Feedback explains which boundary needs attention; a draft is never silently replaced.',
      kind: 'behavior',
      render: () => (
        <div className="date-study-grid-proto">
          <DateRangePicker label="Required date window" required description="Enter both dates." />
          <DateRangePicker label="No date filter" description="DD/MM/YYYY – DD/MM/YYYY" clearable />
          <DateRangePicker
            label="Hover · pinned"
            defaultValue={['2026-09-14', '2026-09-23']}
            previewState="hover"
            clearable
          />
          <DateRangePicker
            label="Keyboard focus · pinned"
            defaultValue={['2026-09-14', '2026-09-23']}
            previewState="keyboard-focus"
            clearable
          />
          <DateRangePicker
            label="One date missing"
            previewText="14/09/2026 – "
            status="danger"
            message="Enter an end date to complete the period."
            clearable
          />
          <DateRangePicker
            label="Reversed dates · keyboard focus pinned"
            previewState="keyboard-focus"
            previewText="23/09/2026 – 14/09/2026"
            status="danger"
            message="The end date must be on or after the start date."
            clearable
          />
          <DateRangePicker
            label="Period too long"
            defaultValue={['2026-09-01', '2026-09-30']}
            maxRangeDays={14}
            status="danger"
            message="Choose no more than 14 days."
            clearable
          />
          <DateRangePicker
            label="Checking dates"
            clearable
            defaultValue={['2026-09-14', '2026-09-23']}
            loading
          />
          <DateRangePicker
            label="Read only"
            defaultValue={['2026-09-14', '2026-09-23']}
            readOnly
            clearable
          />
          <DateRangePicker
            label="Disabled"
            defaultValue={['2026-09-14', '2026-09-23']}
            disabled
            status="danger"
          />
          <DateRangePicker
            label="Dates confirmed"
            defaultValue={['2026-09-14', '2026-09-23']}
            status="success"
            message="The full period is available."
          />
        </div>
      ),
    },
    {
      id: 'panels',
      title: 'Range panels',
      overlayStage: true,
      caption:
        'Panels are kept in flow for comparison. The first day starts a new selection. The second valid day commits the period.',
      kind: 'behavior',
      render: () => (
        <div className="date-study-stack-proto">
          <DateRangePicker
            label="New period · choose two dates"
            defaultOpen
            previewInline
            clearable
          />
          <DateRangePicker
            label="Replace an existing period"
            defaultValue={['2026-09-11', '2026-09-23']}
            defaultOpen
            previewInline
            clearable
          />
          <DateRangePicker
            label="Across two months"
            defaultValue={['2026-09-25', '2026-10-07']}
            defaultOpen
            previewInline
          />
          <DateRangePicker
            label="One-day period"
            defaultValue={['2026-09-16', '2026-09-16']}
            defaultOpen
            previewInline
          />
          <DateRangePicker
            label="Unavailable dates break the period"
            defaultValue={['2026-09-07', '2026-09-11']}
            min="2026-09-07"
            max="2026-09-25"
            unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
            minRangeDays={2}
            maxRangeDays={14}
            defaultOpen
            previewInline
          />
          <DateRangePicker
            label="Read only · inspect the period"
            defaultValue={['2026-09-14', '2026-09-23']}
            readOnly
            defaultOpen
            previewInline
          />
        </div>
      ),
    },
    {
      id: 'locales',
      title: 'Locale, long labels & narrow fields',
      kind: 'behavior',
      render: () => (
        <div className="date-study-grid-proto">
          <DateRangePicker
            label="US period"
            locale="en-US"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
          />
          <DateRangePicker
            label="German period"
            locale="de-DE"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
          />
          <DateRangePicker
            label="Include records modified during the following period"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
            style={{ maxWidth: '17rem' }}
            description="The text input scrolls naturally when editing a narrow field; the calendar panel retains a full month."
          />
        </div>
      ),
    },
    {
      id: 'live',
      title: 'Live · select, replace, dismiss',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'Open either calendar and choose two dates. The first choice stays in the panel. The second valid choice saves the new period and closes it. Dismiss halfway through to keep the original value.',
      kind: 'behavior',
      render: () => (
        <div className="date-live-stage-proto">
          <DateRangePicker
            label="Date window"
            description="Select an inclusive period."
            clearable
          />
          <DateRangePicker
            label="Existing period"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
            style={{ marginBlockStart: '24px' }}
          />
        </div>
      ),
    },
  ],
});
