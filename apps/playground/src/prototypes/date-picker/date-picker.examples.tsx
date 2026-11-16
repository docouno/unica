import { defineSpecimen } from '../../workbench/types.js';
import { DatePicker } from './date-picker.proto.js';
import { DateStudy } from './date-study.proto.js';

export default defineSpecimen({
  id: 'date-picker',
  title: 'DatePicker',
  group: 'Forms',
  summary:
    'Type a date or pick a day. One ordinary text field, a calm calendar, and explicit recovery from invalid input.',
  sections: [
    {
      id: 'anatomy',
      title: 'Date & calendar',
      kind: 'context',
      overlayStage: true,
      caption:
        'The panel is kept in flow for material review. Live anchored behavior is available in the Live section.',
      render: () => (
        <DatePicker
          label="Review date"
          defaultValue="2026-09-16"
          defaultOpen
          previewInline
          clearable
        />
      ),
    },
    {
      id: 'fields',
      title: 'Field roles & sizes',
      kind: 'matrix',
      caption:
        'Default for forms; ghost for inline editing. All fields accept local numeric dates or an ISO date pasted directly.',
      render: () => (
        <div className="date-study-grid-proto">
          {(['s', 'm', 'l'] as const).map((size) => (
            <DateStudy
              key={size}
              label={`${size.toUpperCase()} · ${size === 's' ? '30' : size === 'm' ? '40' : '48'}px`}
            >
              <DatePicker size={size} label="Review date" defaultValue="2026-09-16" clearable />
              <DatePicker
                size={size}
                variant="ghost"
                label="Inline review date"
                defaultValue="2026-09-16"
                clearable
              />
            </DateStudy>
          ))}
        </div>
      ),
    },
    {
      id: 'states',
      title: 'Field states & feedback',
      kind: 'states',
      caption:
        'Hover and keyboard focus are pinned for comparison. Semantic feedback is pinned too; use Live for validation recovery. Read only permits calendar inspection; disabled suppresses status and actions.',
      render: () => (
        <div className="date-study-grid-proto">
          <DatePicker label="Required review date" required description="Choose one date." />
          <DatePicker
            label="Not scheduled"
            description="DD/MM/YYYY · you can also paste an ISO date"
            clearable
          />
          <DatePicker
            label="Hover · pinned"
            defaultValue="2026-09-16"
            previewState="hover"
            clearable
          />
          <DatePicker
            label="Keyboard focus · pinned"
            defaultValue="2026-09-16"
            previewState="keyboard-focus"
            clearable
          />
          <DatePicker
            label="Invalid date · keyboard focus pinned"
            previewState="keyboard-focus"
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
      kind: 'context',
      surface: 'base',
      overlayStage: true,
      caption:
        'Panels are kept in document flow for simultaneous material review. The same panel is used by the live anchored fields below. Choosing a day closes it.',
      render: () => (
        <div className="date-study-stack-proto">
          <DatePicker
            label="Set a date"
            description="An empty field opens on today."
            defaultOpen
            previewInline
            clearable
          />
          <DatePicker
            label="Review date"
            defaultValue="2026-09-16"
            defaultOpen
            previewInline
            clearable
          />
          <DatePicker
            label="Restricted review window"
            defaultValue="2026-09-14"
            min="2026-09-07"
            max="2026-09-25"
            unavailable={['2026-09-18', '2026-09-19', '2026-09-20']}
            defaultOpen
            previewInline
          />
          <DatePicker
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
      kind: 'states',
      caption:
        'DD/MM/YYYY, MM/DD/YYYY and DD.MM.YYYY share one text input. Invalid or unfinished text remains available for correction.',
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
      kind: 'context',
      caption:
        'Tab keeps the calendar closed. Open with the icon or Alt+↓; arrows move through days. Escape or a click outside dismisses the panel. Try typing 31/02/2026, then choose a valid day to recover.',
      surface: 'overlay',
      overlayStage: true,
      render: () => (
        <div className="date-live-stage-proto">
          <DatePicker
            label="Next verification date"
            defaultValue="2026-09-16"
            clearable
            description="DD/MM/YYYY"
          />
          <DatePicker
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
});
