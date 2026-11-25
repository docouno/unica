import { Stack, Text } from '@docouno/unica';
import { DateRangePicker } from '../../prototypes/date-picker/date-picker.proto.js';
import { ExampleSurface } from '../shared/example-surface.js';
import type { PreviewProps } from '../../workbench/types.js';

export function PairedFields({ ctx }: PreviewProps) {
  return (
    <div className="date-study-grid-proto">
      {(['s', 'm', 'l'] as const).map((size) => (
        <Stack key={size} gap={12} style={{ minInlineSize: 0 }}>
          <Text size="caption-l" color="secondary">
            {size.toUpperCase()}
          </Text>
          <DateRangePicker
            subjectAttributes={ctx.subject}
            size={size}
            label="Date window"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
          />
          <DateRangePicker
            subjectAttributes={ctx.subject}
            size={size}
            variant="ghost"
            label="Inline date window"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
          />
        </Stack>
      ))}
    </div>
  );
}

export function Anatomy({ ctx }: PreviewProps) {
  return (
    <div className="date-inline-study">
      <DateRangePicker
        subjectAttributes={ctx.subject}
        data-surface="base"
        label="Date window"
        defaultValue={['2026-09-11', '2026-09-23']}
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
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Required date window"
        required
        description={<bdi>Enter both dates.</bdi>}
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="No date filter"
        description={<bdi>DD/MM/YYYY – DD/MM/YYYY</bdi>}
        clearable
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Pointer editing"
        defaultValue={['2026-09-14', '2026-09-23']}
        clearable
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Keyboard editing"
        defaultValue={['2026-09-14', '2026-09-23']}
        clearable
      />
      <div inert>
        <DateRangePicker
          subjectAttributes={ctx.subject}
          label="One date missing"
          previewText="14/09/2026 – "
          status="danger"
          message={<bdi>Enter an end date to complete the period.</bdi>}
          clearable
        />
      </div>
      <div inert>
        <DateRangePicker
          subjectAttributes={ctx.subject}
          label="Reversed dates"
          previewText="23/09/2026 – 14/09/2026"
          status="danger"
          message={<bdi>The end date must be on or after the start date.</bdi>}
          clearable
        />
      </div>
      <div inert>
        <DateRangePicker
          subjectAttributes={ctx.subject}
          label="Period too long"
          defaultValue={['2026-09-01', '2026-09-30']}
          maxRangeDays={14}
          status="danger"
          message={<bdi>Choose no more than 14 days.</bdi>}
          clearable
        />
      </div>
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Checking dates"
        clearable
        defaultValue={['2026-09-14', '2026-09-23']}
        loading
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Read only"
        defaultValue={['2026-09-14', '2026-09-23']}
        readOnly
        clearable
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Disabled"
        defaultValue={['2026-09-14', '2026-09-23']}
        disabled
        status="danger"
      />
      <div inert>
        <DateRangePicker
          subjectAttributes={ctx.subject}
          label="Dates confirmed"
          defaultValue={['2026-09-14', '2026-09-23']}
          status="success"
          message={<bdi>The full period is available.</bdi>}
        />
      </div>
    </div>
  );
}

export function RangePanels({ ctx }: PreviewProps) {
  return (
    <div className="date-inline-study">
      <div className="date-study-stack-proto">
        <DateRangePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="New period · choose two dates"
          defaultOpen
          previewInline
          clearable
        />
        <DateRangePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="Replace an existing period"
          defaultValue={['2026-09-11', '2026-09-23']}
          defaultOpen
          previewInline
          clearable
        />
        <DateRangePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="Across two months"
          defaultValue={['2026-09-25', '2026-10-07']}
          defaultOpen
          previewInline
        />
        <DateRangePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="One-day period"
          defaultValue={['2026-09-16', '2026-09-16']}
          defaultOpen
          previewInline
        />
        <DateRangePicker
          subjectAttributes={ctx.subject}
          data-surface="base"
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
          subjectAttributes={ctx.subject}
          data-surface="base"
          label="Read only · inspect the period"
          defaultValue={['2026-09-14', '2026-09-23']}
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
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="US period"
        locale="en-US"
        defaultValue={['2026-09-14', '2026-09-23']}
        clearable
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="German period"
        locale="de-DE"
        defaultValue={['2026-09-14', '2026-09-23']}
        clearable
      />
      <DateRangePicker
        subjectAttributes={ctx.subject}
        label="Include records modified during the following period"
        defaultValue={['2026-09-14', '2026-09-23']}
        clearable
        style={{ maxInlineSize: '17rem' }}
        description={<bdi>Move the caret through the full period in this narrow field.</bdi>}
      />
    </div>
  );
}

export function LivePickers({ ctx }: PreviewProps) {
  return (
    <div className="date-live-stage-proto">
      <ExampleSurface surface={ctx.surface} sizing="border-box">
        <Stack gap={24}>
          <DateRangePicker
            subjectAttributes={ctx.subject}
            label="Date window"
            description={<bdi>Select an inclusive period.</bdi>}
            clearable
          />
          <DateRangePicker
            subjectAttributes={ctx.subject}
            label="Existing period"
            defaultValue={['2026-09-14', '2026-09-23']}
            clearable
          />
        </Stack>
      </ExampleSurface>
    </div>
  );
}
