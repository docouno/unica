import { defineComponent } from '../../workbench/types.js';
import { DatePicker } from '../../prototypes/date-picker/date-picker.proto.js';

const reviewDate = '2026-09-16';

export default defineComponent({
  id: 'date-picker',
  title: 'DatePicker',
  category: 'Selection & Pickers',
  status: 'Proto',
  summary:
    'Type a date or pick a day. One ordinary text field, a calm calendar, and explicit recovery from invalid input.',
  props: {
    variant: {
      kind: 'enum',
      group: 'Field',
      description: 'Default for a standalone field, ghost for inline editing.',
      default: 'default',
      choices: [{ value: 'default' }, { value: 'ghost' }],
    },
    size: {
      kind: 'enum',
      group: 'Field',
      description: 'The nominal control height at standard text size.',
      default: 'm',
      choices: [
        { value: 's', label: 'S · 30px' },
        { value: 'm', label: 'M · 40px' },
        { value: 'l', label: 'L · 48px' },
      ],
    },
    locale: {
      kind: 'enum',
      group: 'Field',
      description: 'The numeric date format and calendar locale.',
      default: 'en-GB',
      choices: [
        { value: 'en-GB', label: 'English (UK)' },
        { value: 'en-US', label: 'English (US)' },
        { value: 'de-DE', label: 'German' },
      ],
    },
    clearable: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Show a clear action when the field has a value.',
      default: false,
    },
    required: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Require a valid date when editing.',
      default: false,
    },
    readOnly: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Allow calendar inspection while keeping the date fixed.',
      default: false,
    },
    disabled: {
      kind: 'boolean',
      group: 'Availability',
      description: 'Disable date entry and prevent opening the calendar.',
      default: false,
    },
    status: {
      kind: 'enum',
      group: 'Feedback',
      description: 'Set semantic feedback before any local validation error.',
      default: 'neutral',
      choices: [
        { value: 'neutral' },
        { value: 'info' },
        { value: 'success' },
        { value: 'warning' },
        { value: 'danger' },
      ],
    },
    loading: {
      kind: 'boolean',
      group: 'Feedback',
      description: 'Show that a date check is pending.',
      default: false,
    },
    onValueChange: {
      kind: 'action',
      group: 'Interaction',
      description: 'Record the selected ISO date or a cleared value.',
      code: 'handleDateChange',
    },
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: ['status', 'loading'],
      reason: 'A disabled field suppresses its status and loading indicators.',
    },
    {
      kind: 'ignored',
      when: { readOnly: true },
      affects: ['clearable'],
      reason: 'A read-only field keeps its current value and hides the clear action.',
    },
  ],
  render: ({ ctx, values }) => (
    <DatePicker
      {...values}
      style={{ inlineSize: 'min(100%, 22rem)' }}
      subjectAttributes={ctx.subject}
      label={values.variant === 'ghost' ? 'Inline review date' : 'Review date'}
      defaultValue={reviewDate}
      onValueChange={ctx.action('onValueChange')}
    />
  ),
  code: ({ variant, size, locale, clearable, required, readOnly, disabled, status, loading }) => {
    const attributes = [
      `label="${variant === 'ghost' ? 'Inline review date' : 'Review date'}"`,
      `defaultValue="${reviewDate}"`,
      variant !== 'default' ? `variant="${variant}"` : '',
      size !== 'm' ? `size="${size}"` : '',
      locale !== 'en-GB' ? `locale="${locale}"` : '',
      clearable ? 'clearable' : '',
      required ? 'required' : '',
      readOnly ? 'readOnly' : '',
      disabled ? 'disabled' : '',
      status !== 'neutral' ? `status="${status}"` : '',
      loading ? 'loading' : '',
      'onValueChange={handleDateChange}',
    ].filter(Boolean);
    return `<DatePicker\n  ${attributes.join('\n  ')}\n/>`;
  },
  matrixViews: [
    {
      id: 'fields',
      title: 'Field roles & sizes',
      caption:
        'Default for forms; ghost for inline editing. All fields accept local numeric dates or an ISO date pasted directly.',
      rows: 'size',
      cols: 'variant',
      fixed: { clearable: true },
    },
  ],
  cases: [
    {
      id: 'anatomy',
      title: 'Date & calendar',
      overlayStage: true,
      caption:
        'The panel is kept in flow for material review. Live anchored behavior is available in the Live section.',
      kind: 'surface',
      mode: 'pinned',
      render: ({ ctx }) => (
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Review date"
          defaultValue="2026-09-16"
          defaultOpen
          previewInline
          clearable
        />
      ),
    },
    {
      id: 'states',
      title: 'Field states & feedback',
      caption:
        'Hover or tab into each field. Semantic feedback is pinned for comparison; use Live for validation recovery. Read only permits calendar inspection; disabled suppresses status and actions.',
      kind: 'behavior',
      mode: 'pinned',
      render: () => (
        <div className="date-study-grid-proto">
          <DatePicker label="Required review date" required description="Choose one date." />
          <DatePicker
            label="Not scheduled"
            description="DD/MM/YYYY · you can also paste an ISO date"
            clearable
          />
          <DatePicker label="Pointer editing" defaultValue="2026-09-16" clearable />
          <DatePicker label="Keyboard editing" defaultValue="2026-09-16" clearable />
          <DatePicker
            label="Invalid date · keyboard editing"
            previewText="31/02/2026"
            status="danger"
            message="February has no 31st day. Enter a real date."
            clearable
          />
          <DatePicker
            label="Incomplete draft"
            previewText="14/09/"
            status="danger"
            message="Complete the date with a four-digit year."
            clearable
          />
          <DatePicker
            label="Unavailable date"
            defaultValue="2026-09-20"
            status="danger"
            message="This date is unavailable. Choose another day."
            unavailable={['2026-09-20']}
            clearable
          />
          <DatePicker
            label="Review recommended"
            defaultValue="2026-09-16"
            status="warning"
            message="This is earlier than the usual review cycle."
            clearable
          />
          <DatePicker
            label="Date verified"
            defaultValue="2026-09-16"
            status="success"
            message="The review date is confirmed."
          />
          <DatePicker
            label="Policy information"
            defaultValue="2026-09-16"
            status="info"
            message="Dates are recorded without a time zone."
          />
          <DatePicker label="Checking availability" clearable defaultValue="2026-09-16" loading />
          <DatePicker label="Read only" defaultValue="2026-09-16" readOnly clearable />
          <DatePicker label="Disabled" defaultValue="2026-09-16" disabled status="danger" />
        </div>
      ),
    },
    {
      id: 'panels',
      title: 'Calendar panel · Base → Overlay',
      surface: 'base',
      overlayStage: true,
      caption:
        'Panels are kept in document flow for simultaneous material review. The same panel is used by the live anchored fields below. Choosing a day closes it.',
      kind: 'surface',
      mode: 'pinned',
      render: ({ ctx }) => (
        <div className="date-study-stack-proto" data-surface="base">
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Set a date"
            description="An empty field opens on today."
            defaultOpen
            previewInline
            clearable
          />
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Six-week month"
            defaultValue="2026-03-30"
            defaultOpen
            previewInline
            clearable
          />
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Restricted review window"
            defaultValue="2026-09-14"
            min="2026-09-07"
            max="2026-09-25"
            unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
            defaultOpen
            previewInline
          />
          <DatePicker
            subjectAttributes={ctx.subject}
            label="View a fixed date"
            defaultValue="2026-09-16"
            readOnly
            defaultOpen
            previewInline
          />
        </div>
      ),
    },
    {
      id: 'locales',
      title: 'Formatting & constrained space',
      caption:
        'DD/MM/YYYY, MM/DD/YYYY and DD.MM.YYYY share one text input. Invalid or unfinished text remains available for correction.',
      kind: 'content',
      render: () => (
        <div className="date-study-grid-proto">
          <DatePicker label="US date" locale="en-US" defaultValue="2026-09-16" clearable />
          <DatePicker label="German date" locale="de-DE" defaultValue="2026-09-16" clearable />
          <DatePicker
            label="Next scheduled verification for this document"
            description="A long label and a narrow field keep their natural line breaks."
            defaultValue="2026-09-16"
            style={{ maxWidth: '14rem' }}
            clearable
            status="warning"
            message="Review this date with the document owner before confirming."
          />
        </div>
      ),
    },
    {
      id: 'live',
      title: 'Live · anchored picker',
      caption:
        'Tab keeps the calendar closed. Open with the icon or Alt+↓; arrows move through days. Escape or a click outside dismisses the panel. Try typing 31/02/2026, then choose a valid day to recover.',
      surface: 'overlay',
      overlayStage: true,
      kind: 'behavior',
      mode: 'live',
      render: ({ ctx }) => (
        <div className="date-live-stage-proto">
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Next verification date"
            defaultValue="2026-09-16"
            clearable
            description="DD/MM/YYYY"
          />
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Inline date"
            variant="ghost"
            defaultValue="2026-09-14"
            clearable
            style={{ marginBlockStart: '24px' }}
          />
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'schedule',
      title: 'Schedule a review',
      code: '<DatePicker\n  label="Review date"\n  description="Optional. Enter a date or choose one from the calendar."\n  clearable\n/>',
      render: () => (
        <DatePicker
          label="Review date"
          description="Optional. Enter a date or choose one from the calendar."
          clearable
        />
      ),
    },
  ],
});
