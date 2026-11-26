import { useCallback, useId, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button, FormField, Input, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { FieldStatus, FieldVariant } from '@docouno/unica';
import { NumberField } from './number-field.js';

function Example({
  title,
  titleId,
  children,
}: {
  readonly title: string;
  readonly titleId?: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="number-example">
      <Text as="span" id={titleId} size="caption-l" weight="medium" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}

export function NumberRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Form field' : 'Inline editor'}>
          <div className="number-demo-stack">
            {(['s', 'm', 'l'] as const).map((size) => (
              <NumberField
                subject={ctx.subject}
                key={size}
                size={size}
                variant={variant}
                label={`${size.toUpperCase()} · Optional limit`}
                placeholder="No limit"
                min={0}
                suffix="items"
                description={<bdi>Leave empty for unlimited items.</bdi>}
              />
            ))}
          </div>
        </Example>
      ))}
    </div>
  );
}

export function NumberAnatomy({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      <Example title="An amount">
        <NumberField
          subject={ctx.subject}
          label="Unit price"
          prefix="$"
          suffix="USD"
          defaultValue={24.5}
          min={0}
          step={0.5}
          description={<bdi>Enter the price in US dollars.</bdi>}
        />
      </Example>
      <Example title="Signed decimal">
        <NumberField
          subject={ctx.subject}
          label="Exposure adjustment"
          defaultValue={-1.25}
          min={-5}
          max={5}
          step={0.25}
          suffix="EV"
          description={<bdi>Adjust exposure in quarter stops.</bdi>}
        />
      </Example>
      <Example title="Intrinsic width with feedback">
        <NumberField
          subject={ctx.subject}
          label="Reserved capacity"
          prefix="≈"
          defaultValue={64}
          suffix="GiB"
          width="auto"
          status="warning"
          loading
          message={<bdi>Checking the remaining quota in gibibytes.</bdi>}
        />
      </Example>
      <Example title="Compact amount">
        <NumberField
          subject={ctx.subject}
          label="Copies"
          defaultValue={2}
          min={1}
          max={9}
          width="auto"
          description={<bdi>Choose up to nine copies.</bdi>}
        />
      </Example>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example key={size} title={`${size.toUpperCase()} · controls`}>
          <form className="number-size-comparison" onSubmit={(event) => event.preventDefault()}>
            <FormField label="Reference" size={size}>
              <Input defaultValue="Document" />
            </FormField>
            <NumberField
              subject={ctx.subject}
              size={size}
              aria-label={`${size} copies`}
              defaultValue={2}
              min={1}
              max={9}
            />
            <Button size={size} variant="secondary" tone="neutral" type="reset">
              Reset
            </Button>
          </form>
        </Example>
      ))}
    </div>
  );
}

export function NumberInteraction({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Form field' : 'Inline editor'}>
          <NumberField
            subject={ctx.subject}
            label="Quantity"
            defaultValue={12}
            min={0}
            max={99}
            variant={variant}
          />
        </Example>
      ))}
    </div>
  );
}

const feedback: readonly [FieldStatus, string, number, string][] = [
  ['neutral', 'Standard limit', 12, 'Choose a limit from 1 to 50.'],
  ['info', 'Recommended limit', 12, 'A limit of 12 suits most workloads.'],
  ['success', 'Capacity confirmed', 12, 'The capacity check passed.'],
  ['warning', 'Near the quota', 48, 'This leaves little room for another workload.'],
  ['danger', 'Limit exceeds capacity', 125, 'Enter 50 or less, or decrease to 50.'],
];
export function NumberFeedback({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Form field' : 'Inline editor'}>
          <div className="number-demo-stack">
            {feedback.map(([status, label, value, message]) => (
              <NumberField
                subject={ctx.subject}
                key={status}
                label={label}
                variant={variant}
                status={status}
                defaultValue={value}
                min={1}
                max={50}
                message={<bdi>{message}</bdi>}
              />
            ))}
          </div>
        </Example>
      ))}
      <Example title="Focus and feedback">
        <div className="number-demo-stack">
          <NumberField
            subject={ctx.subject}
            label="Danger"
            defaultValue={125}
            min={0}
            max={50}
            status="danger"
            message={<bdi>Enter a number from 0 to 50.</bdi>}
          />
          <NumberField
            subject={ctx.subject}
            label="Warning"
            defaultValue={48}
            min={0}
            max={50}
            status="warning"
            message={<bdi>Few workers remain available.</bdi>}
          />
          <NumberField
            subject={ctx.subject}
            variant="ghost"
            label="Ghost · success"
            defaultValue={12}
            min={0}
            max={50}
            status="success"
            message={<bdi>Capacity confirmed.</bdi>}
          />
        </div>
      </Example>
    </div>
  );
}

function AvailabilityColumn({
  variant,
  ctx,
}: PreviewProps & { readonly variant: FieldVariant }): ReactElement {
  const contextId = useId();
  return (
    <Example
      titleId={contextId}
      title={
        variant === 'default'
          ? 'Form field · interval in seconds'
          : 'Inline editor · interval in seconds'
      }
    >
      <div className="number-demo-stack">
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Editable"
          defaultValue={12}
          suffix="s"
          min={5}
          max={120}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only"
          defaultValue={30}
          suffix="s"
          readOnly
          description={<bdi>The workspace policy sets the interval.</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Disabled"
          defaultValue={30}
          suffix="s"
          disabled
          description={<bdi>Enable scheduled snapshots to edit the interval.</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Checking · still editable"
          defaultValue={30}
          suffix="s"
          loading
          message={<bdi>Checking the interval…</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only · loading"
          defaultValue={30}
          suffix="s"
          loading
          readOnly
          message={<bdi>Applying the workspace policy…</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Warning · loading"
          defaultValue={110}
          min={5}
          max={120}
          suffix="s"
          status="warning"
          loading
          message={<bdi>Checking whether this interval meets policy…</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only · danger"
          defaultValue={125}
          max={120}
          suffix="s"
          status="danger"
          readOnly
          message={<bdi>The policy exceeds the supported 120 s. Contact an administrator.</bdi>}
        />
        <NumberField
          subject={ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Disabled · status and loading suppressed"
          defaultValue={125}
          suffix="s"
          status="danger"
          loading
          disabled
          description={<bdi>Unavailable while scheduled snapshots are off.</bdi>}
        />
      </div>
    </Example>
  );
}
export function NumberAvailability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      <AvailabilityColumn ctx={ctx} variant="default" />
      <AvailabilityColumn ctx={ctx} variant="ghost" />
    </div>
  );
}

function BoundaryExample({
  ctx,
  label,
  initial,
  min,
  max,
  step = 1,
  suffix,
}: PreviewProps & {
  readonly label: string;
  readonly initial: number | '';
  readonly min?: number;
  readonly max?: number;
  readonly step?: number | 'any';
  readonly suffix?: string;
}): ReactElement {
  const [error, setError] = useState('');
  const validate = useCallback(
    (input: HTMLInputElement | null): void => {
      if (!input) {
        return;
      }
      const { badInput, rangeUnderflow, rangeOverflow, stepMismatch } = input.validity;
      setError(
        badInput
          ? 'Finish entering the number.'
          : rangeUnderflow
            ? `Enter ${min} or more, or increase to ${min}.`
            : rangeOverflow
              ? `Enter ${max} or less, or decrease toward the allowed range.`
              : stepMismatch
                ? `Use steps of ${step} starting at ${min ?? 0}.`
                : '',
      );
    },
    [min, max, step],
  );
  const help =
    step === 'any'
      ? 'Any decimal is allowed. Buttons add or subtract 1.'
      : `Range ${min ?? '−∞'} to ${max ?? '∞'}; step ${step}.`;
  return (
    <NumberField
      subject={ctx.subject}
      ref={validate}
      label={label}
      defaultValue={initial}
      min={min}
      max={max}
      step={step}
      suffix={suffix}
      status={error ? 'danger' : 'neutral'}
      message={<bdi>{error || help}</bdi>}
      onInput={() => setError('')}
      onBlur={(event) => validate(event.currentTarget)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          validate(event.currentTarget);
        }
      }}
    />
  );
}

export function NumberBounds({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      <Example title="Domain edges">
        <div className="number-demo-stack">
          <BoundaryExample ctx={ctx} label="At the minimum" initial={0} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="At the maximum" initial={50} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="One permitted value" initial={5} min={5} max={5} />
        </div>
      </Example>
      <Example title="Out-of-range and off-step">
        <div className="number-demo-stack">
          <BoundaryExample ctx={ctx} label="Above the maximum" initial={125} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="Below the minimum" initial={-5} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="Between steps" initial={12} min={0} max={50} step={5} />
          <BoundaryExample
            ctx={ctx}
            label="Maximum between steps"
            initial={12}
            min={0}
            max={12}
            step={5}
          />
        </div>
      </Example>
      <Example title="Empty, fractional, and negative domains">
        <div className="number-demo-stack">
          <BoundaryExample
            ctx={ctx}
            label="Empty positive range"
            initial=""
            min={5}
            max={120}
            step={5}
          />
          <BoundaryExample ctx={ctx} label="Tenths" initial={0.2} min={0} max={1} step={0.1} />
          <BoundaryExample
            ctx={ctx}
            label="Negative decimal"
            initial={-1.25}
            min={-5}
            max={5}
            step={0.25}
          />
          <BoundaryExample ctx={ctx} label="Any precision" initial={0.25} step="any" />
          <BoundaryExample
            ctx={ctx}
            label="Negative range"
            initial=""
            min={-20}
            max={-5}
            step={5}
          />
        </div>
      </Example>
    </div>
  );
}

export function NumberLive({ ctx }: PreviewProps): ReactElement {
  const input = useRef<HTMLInputElement>(null);
  const [state, setState] = useState<'editing' | 'checking' | 'accepted' | 'rejected'>('editing');
  const [reason, setReason] = useState('');
  const [checkedValue, setCheckedValue] = useState(12);
  const pending = useRef<number | null>(null);

  function check(editor: HTMLInputElement): void {
    const { badInput, valueMissing, rangeUnderflow, rangeOverflow, stepMismatch } = editor.validity;
    const error = badInput
      ? 'Finish entering the number.'
      : valueMissing
        ? 'Enter a worker limit.'
        : rangeUnderflow || rangeOverflow
          ? 'Enter a limit from 1 to 50. Your value has been kept.'
          : stepMismatch
            ? 'Use whole workers, in steps of 1. Your value has been kept.'
            : '';
    if (error) {
      pending.current = null;
      setReason(error);
      setState('rejected');
    } else {
      pending.current = editor.valueAsNumber;
      setState('checking');
    }
  }

  useStoryAction(ctx, (action) => {
    if (action === 'check' && input.current) {
      check(input.current);
      return;
    }
    const candidate = pending.current;
    if (candidate === null || (action !== 'accept' && action !== 'capacity')) {
      return;
    }
    pending.current = null;
    if (action === 'capacity' && candidate > 8) {
      setReason('Only 8 workers are available. Enter 8 or fewer.');
      setState('rejected');
    } else {
      setCheckedValue(candidate);
      setState('accepted');
    }
  });
  return (
    <div className="number-examples">
      <Example title="Capacity check">
        <div className="number-demo-stack">
          <NumberField
            subject={ctx.subject}
            label="Worker limit"
            required
            ref={input}
            defaultValue={12}
            min={1}
            max={50}
            suffix="jobs"
            loading={state === 'checking'}
            status={state === 'rejected' ? 'danger' : state === 'accepted' ? 'success' : 'neutral'}
            description={<bdi>Each worker can run one job at a time.</bdi>}
            message={
              <span role="status">
                <bdi>
                  {state === 'checking'
                    ? 'Checking available capacity…'
                    : state === 'accepted'
                      ? `Capacity confirmed for ${checkedValue} ${checkedValue === 1 ? 'worker' : 'workers'}.`
                      : state === 'rejected'
                        ? reason
                        : 'Enter a whole number from 1 to 50.'}
                </bdi>
              </span>
            }
            onInput={() => {
              pending.current = null;
              setState('editing');
            }}
            onBlur={(event) => {
              if (!event.currentTarget.validity.valid) {
                check(event.currentTarget);
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                check(event.currentTarget);
              }
            }}
          />
        </div>
      </Example>
      <Example title="Dimensions">
        <InlineProperties ctx={ctx} />
      </Example>
    </div>
  );
}

function InlineProperties({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  return (
    <div className="number-inspector">
      {(
        [
          ['Width (pixels)', 320, 'px'],
          ['Height (pixels)', 240, 'px'],
          ['Opacity (percent)', 80, '%'],
        ] as const
      ).map(([label, value, suffix], index) => (
        <div className="number-inspector-row" key={label}>
          <Text as="label" htmlFor={`${id}-${index}`} size="body-s">
            {label}
          </Text>
          <NumberField
            subject={ctx.subject}
            id={`${id}-${index}`}
            variant="ghost"
            size="s"
            defaultValue={value}
            suffix={suffix}
            min={0}
            max={suffix === '%' ? 100 : 2000}
          />
        </div>
      ))}
    </div>
  );
}

export function NumberOverflow({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples">
      <Example title="Long labels and feedback">
        <BoundaryExample
          ctx={ctx}
          label="Maximum number of concurrent background export jobs"
          initial={125}
          min={1}
          max={50}
          suffix="jobs"
        />
      </Example>
      <Example title="Long quantity">
        <NumberField
          subject={ctx.subject}
          label="Sample count"
          defaultValue={123456789012345}
          suffix="items"
          step="any"
        />
      </Example>
      <Example title="Abbreviated unit">
        <NumberField
          subject={ctx.subject}
          label="Transfer rate in megabytes per second"
          defaultValue={128.5}
          suffix="MB/s"
          min={0}
          step={0.5}
          description={<bdi>Set the maximum rate for background transfers.</bdi>}
        />
      </Example>
      <Example title="Storage and quota">
        <NumberField
          subject={ctx.subject}
          label="Allocated storage"
          prefix="≈"
          defaultValue={1024}
          suffix="GiB"
          status="warning"
          loading
          message={<bdi>Checking how many gibibytes fit within the storage quota.</bdi>}
        />
      </Example>
      <Example title="Intrinsic width">
        <NumberField
          subject={ctx.subject}
          label="Item count"
          defaultValue={123456}
          min={0}
          width="auto"
        />
      </Example>
      <Example title="Signed temperature">
        <NumberField
          subject={ctx.subject}
          label="Temperature offset"
          defaultValue={-12.5}
          min={-40}
          max={40}
          suffix="°C"
          step={0.5}
          description={<bdi>Adjust the temperature in half-degree Celsius increments.</bdi>}
        />
      </Example>
    </div>
  );
}

export function NumberSurfaces({ ctx }: PreviewProps): ReactElement {
  const fields = (
    <div className="number-demo-stack">
      <NumberField
        subject={ctx.subject}
        label="Snapshot interval in seconds"
        defaultValue={30}
        min={5}
        max={120}
        step={5}
        suffix="s"
      />
      <NumberField
        subject={ctx.subject}
        variant="ghost"
        label="Inline threshold in percent"
        defaultValue={75}
        min={0}
        max={100}
        suffix="%"
      />
      <NumberField
        subject={ctx.subject}
        label="Requested capacity"
        defaultValue={125}
        min={1}
        max={50}
        status="danger"
        message={<bdi>Enter 50 or less.</bdi>}
      />
    </div>
  );
  return ctx.surface === 'overlay' ? (
    <div className="number-material unica-overlay-surface" data-surface="overlay">
      {fields}
    </div>
  ) : (
    <div className="number-material" data-surface="base">
      {fields}
    </div>
  );
}
