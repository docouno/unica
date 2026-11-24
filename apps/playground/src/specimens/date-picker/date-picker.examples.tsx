import { Stack } from '@docouno/unica';
import { DatePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';

export function Anatomy({ ctx }: PreviewProps) {
  return (
    <div className="date-inline-study">
      <DatePicker
        subjectAttributes={ctx.subject}
        data-surface="base"
        label="Review date"
        defaultValue="2026-09-16"
        defaultOpen
        previewInline
        clearable
      />
    </div>
  );
}

export function FieldStates({ ctx }: PreviewProps) {
  return (
    <div className="date-study-grid-proto">
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Required review date"
        required
        description={<bdi>Choose one date.</bdi>}
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Not scheduled"
        description={<bdi>DD/MM/YYYY · you can also paste an ISO date</bdi>}
        clearable
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Pointer editing"
        defaultValue="2026-09-16"
        clearable
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Keyboard editing"
        defaultValue="2026-09-16"
        clearable
      />
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Invalid date"
          previewText="31/02/2026"
          status="danger"
          message={<bdi>February has no 31st day. Enter a real date.</bdi>}
          clearable
        />
      </div>
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Incomplete draft"
          previewText="14/09/"
          status="danger"
          message={<bdi>Complete the date with a four-digit year.</bdi>}
          clearable
        />
      </div>
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Unavailable date"
          defaultValue="2026-09-20"
          status="danger"
          message={<bdi>This date is unavailable. Choose another day.</bdi>}
          unavailable={['2026-09-20']}
          clearable
        />
      </div>
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Review recommended"
          defaultValue="2026-09-16"
          status="warning"
          message={<bdi>This is earlier than the usual review cycle.</bdi>}
          clearable
        />
      </div>
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Date verified"
          defaultValue="2026-09-16"
          status="success"
          message={<bdi>The review date is confirmed.</bdi>}
        />
      </div>
      <div inert>
        <DatePicker
          subjectAttributes={ctx.subject}
          label="Policy information"
          defaultValue="2026-09-16"
          status="info"
          message={<bdi>Dates are recorded without a time zone.</bdi>}
        />
      </div>
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Checking availability"
        clearable
        defaultValue="2026-09-16"
        loading
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Read only"
        defaultValue="2026-09-16"
        readOnly
        clearable
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Disabled"
        defaultValue="2026-09-16"
        disabled
        status="danger"
      />
    </div>
  );
}

export function Panels({ ctx }: PreviewProps) {
  return (
    <div className="date-inline-study">
      <div className="date-study-stack-proto">
        <DatePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="Set a date"
          description={<bdi>An empty field opens on today.</bdi>}
          defaultOpen
          previewInline
          clearable
        />
        <DatePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="Six-week month"
          defaultValue="2026-03-30"
          defaultOpen
          previewInline
          clearable
        />
        <DatePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
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
          data-surface="base"
          label="View a fixed date"
          defaultValue="2026-09-16"
          readOnly
          defaultOpen
          previewInline
        />
      </div>
    </div>
  );
}

export function Locales({ ctx }: PreviewProps) {
  return (
    <div className="date-study-grid-proto">
      <DatePicker
        subjectAttributes={ctx.subject}
        label="US date"
        locale="en-US"
        defaultValue="2026-09-16"
        clearable
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="German date"
        locale="de-DE"
        defaultValue="2026-09-16"
        clearable
      />
      <DatePicker
        subjectAttributes={ctx.subject}
        label="Next scheduled verification for this document"
        description={<bdi>A long label and a narrow field keep their natural line breaks.</bdi>}
        defaultValue="2026-09-16"
        className="date-narrow-study"
        clearable
        status="warning"
        message={<bdi>Review this date with the document owner before confirming.</bdi>}
      />
    </div>
  );
}

export function LivePickers({ ctx }: PreviewProps) {
  return (
    <div className="date-live-stage-proto">
      <ExampleSurface surface={ctx.surface} sizing="border-box">
        <Stack gap={24}>
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Next verification date"
            defaultValue="2026-09-16"
            clearable
            description={<bdi>DD/MM/YYYY</bdi>}
          />
          <DatePicker
            subjectAttributes={ctx.subject}
            label="Inline date"
            variant="ghost"
            defaultValue="2026-09-14"
            clearable
          />
        </Stack>
      </ExampleSurface>
    </div>
  );
}
