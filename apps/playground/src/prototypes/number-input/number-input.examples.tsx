import { FormField } from '@docouno/unica';
import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button, Input, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { FieldStatus, FieldVariant } from '@docouno/unica';
import { NumberInput } from './number-input.proto.js';
import './number-input.examples.css';

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
    <div className="number-example-proto">
      <Text as="span" id={titleId} size="caption-l" weight="medium" color="muted">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </div>
  );
}

export function NumberRoles({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Form field' : 'Inline editor'}>
          <div className="number-demo-stack-proto">
            {(['s', 'm', 'l'] as const).map((size) => (
              <NumberInput
                {...ctx.subject}
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
  const id = useId();
  return (
    <div className="number-examples-proto">
      <Example title="An amount">
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
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
          <form
            className="number-size-comparison-proto"
            onSubmit={(event) => event.preventDefault()}
          >
            <FormField controlId={`${id}-reference-${size}`} label="Reference" size={size}>
              <Input id={`${id}-reference-${size}`} size={size} defaultValue="Document" />
            </FormField>
            <NumberInput
              {...ctx.subject}
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
  const states = [
    ['Rest', undefined, undefined],
    ['Field hover', 'hover', undefined],
    ['Pointer editing', 'pointer-focus', undefined],
    ['Keyboard focus', 'keyboard-focus', undefined],
    ['Decrease · hover', undefined, 'decrement-hover'],
    ['Decrease · press', undefined, 'decrement-active'],
    ['Increase · hover', undefined, 'increment-hover'],
    ['Increase · press', undefined, 'increment-active'],
  ] as const;
  return (
    <div className="number-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Default' : 'Ghost'}>
          <div className="number-demo-stack-proto">
            {states.map(([name, previewState, previewAction]) => (
              <NumberInput
                {...ctx.subject}
                key={name}
                label={name}
                defaultValue={12}
                min={0}
                max={99}
                variant={variant}
                previewState={previewState}
                previewAction={previewAction}
              />
            ))}
          </div>
        </Example>
      ))}
      <Example title="Live quantity">
        <NumberInput {...ctx.subject} label="Quantity" defaultValue={12} min={0} max={99} />
      </Example>
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
    <div className="number-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example key={variant} title={variant === 'default' ? 'Form field' : 'Inline editor'}>
          <div className="number-demo-stack-proto">
            {feedback.map(([status, label, value, message]) => (
              <NumberInput
                {...ctx.subject}
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
      <Example title="Focused fields">
        <div className="number-demo-stack-proto">
          <NumberInput
            {...ctx.subject}
            label="Keyboard focus · danger"
            defaultValue={125}
            min={0}
            max={50}
            status="danger"
            previewState="keyboard-focus"
            message={<bdi>Enter a number from 0 to 50.</bdi>}
          />
          <NumberInput
            {...ctx.subject}
            label="Pointer focus · warning"
            defaultValue={48}
            min={0}
            max={50}
            status="warning"
            previewState="pointer-focus"
            message={<bdi>Few workers remain available.</bdi>}
          />
          <NumberInput
            {...ctx.subject}
            variant="ghost"
            label="Ghost · keyboard focus · success"
            defaultValue={12}
            min={0}
            max={50}
            status="success"
            previewState="keyboard-focus"
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
      <div className="number-demo-stack-proto">
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Editable"
          defaultValue={12}
          suffix="s"
          min={5}
          max={120}
        />
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only"
          defaultValue={30}
          suffix="s"
          readOnly
          description={<bdi>The workspace policy sets the interval.</bdi>}
        />
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only · keyboard focus"
          defaultValue={30}
          suffix="s"
          readOnly
          previewState="keyboard-focus"
        />
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Disabled"
          defaultValue={30}
          suffix="s"
          disabled
          description={<bdi>Enable scheduled snapshots to edit the interval.</bdi>}
        />
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Checking · still editable"
          defaultValue={30}
          suffix="s"
          loading
          message={<bdi>Checking the interval…</bdi>}
        />
        <NumberInput
          {...ctx.subject}
          aria-describedby={contextId}
          variant={variant}
          label="Read-only · loading"
          defaultValue={30}
          suffix="s"
          loading
          readOnly
          message={<bdi>Applying the workspace policy…</bdi>}
        />
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
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
    <div className="number-examples-proto">
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
  const [value, setValue] = useState<number | ''>(initial);
  const [checked, setChecked] = useState(true);
  const [badInput, setBadInput] = useState(false);
  const low = value !== '' && min !== undefined && value < min;
  const high = value !== '' && max !== undefined && value > max;
  const offGrid =
    value !== '' &&
    step !== 'any' &&
    Math.abs((value - (min ?? 0)) / step - Math.round((value - (min ?? 0)) / step)) > 1e-7;
  const invalid = checked && (low || high || offGrid || badInput);
  const message = invalid
    ? badInput
      ? 'Finish entering the number.'
      : low
        ? `Enter ${min} or more, or increase to ${min}.`
        : high
          ? `Enter ${max} or less, or decrease toward the allowed range.`
          : `Use steps of ${step} starting at ${min ?? 0}.`
    : step === 'any'
      ? 'Any decimal is allowed. Buttons add or subtract 1.'
      : `Range ${min ?? '−∞'} to ${max ?? '∞'}; step ${step}.`;
  return (
    <NumberInput
      {...ctx.subject}
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      suffix={suffix}
      status={invalid ? 'danger' : 'neutral'}
      message={<bdi>{message}</bdi>}
      onValueChange={(next) => {
        setValue(next);
        setChecked(false);
        setBadInput(false);
      }}
      onBlur={(event) => {
        setBadInput(event.currentTarget.validity.badInput);
        setChecked(true);
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          setBadInput(event.currentTarget.validity.badInput);
          setChecked(true);
        }
      }}
    />
  );
}
export function NumberBounds({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="number-examples-proto">
      <Example title="Domain edges">
        <div className="number-demo-stack-proto">
          <BoundaryExample ctx={ctx} label="At the minimum" initial={0} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="At the maximum" initial={50} min={0} max={50} />
          <BoundaryExample ctx={ctx} label="One permitted value" initial={5} min={5} max={5} />
        </div>
      </Example>
      <Example title="Out-of-range and off-step">
        <div className="number-demo-stack-proto">
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
        <div className="number-demo-stack-proto">
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
  const [value, setValue] = useState<number | ''>(12);
  const [state, setState] = useState<'editing' | 'checking' | 'accepted' | 'rejected'>('editing');
  const [reason, setReason] = useState('');
  const [bad, setBad] = useState(false);
  const check = (): void => {
    if (bad || value === '' || value < 1 || value > 50 || !Number.isInteger(value)) {
      setReason(
        bad
          ? 'Finish entering the number.'
          : value === ''
            ? 'Enter a worker limit.'
            : value < 1 || value > 50
              ? 'Enter a limit from 1 to 50. Your value has been kept.'
              : 'Use whole workers, in steps of 1. Your value has been kept.',
      );
      setState('rejected');
    } else {
      setState('checking');
    }
  };
  useStoryAction(ctx, (action) => {
    if (action === 'check') {
      check();
    }
    if (state !== 'checking') {
      return;
    }
    if (action === 'accept') {
      setState('accepted');
    }
    if (action === 'capacity') {
      if (value !== '' && value <= 8) {
        setState('accepted');
      } else {
        setReason('Only 8 workers are available. Enter 8 or fewer.');
        setState('rejected');
      }
    }
  });
  return (
    <div className="number-examples-proto">
      <Example title="Capacity check">
        <div className="number-demo-stack-proto">
          <NumberInput
            {...ctx.subject}
            label="Worker limit"
            required
            value={value}
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
                      ? `Capacity confirmed for ${value} ${value === 1 ? 'worker' : 'workers'}.`
                      : state === 'rejected'
                        ? reason
                        : 'Enter a whole number from 1 to 50.'}
                </bdi>
              </span>
            }
            onValueChange={(next) => {
              setValue(next);
              setBad(false);
              setState('editing');
            }}
            onChange={(event) => setBad(event.currentTarget.validity.badInput)}
            onBlur={() => {
              if (bad || value === '' || value < 1 || value > 50 || !Number.isInteger(value)) {
                check();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                check();
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
    <div className="number-inspector-proto">
      {(
        [
          ['Width (pixels)', 320, 'px'],
          ['Height (pixels)', 240, 'px'],
          ['Opacity (percent)', 80, '%'],
        ] as const
      ).map(([label, value, suffix], index) => (
        <div className="number-inspector-row-proto" key={label}>
          <Text as="label" htmlFor={`${id}-${index}`} size="body-s">
            {label}
          </Text>
          <NumberInput
            {...ctx.subject}
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
    <div className="number-examples-proto">
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
        <NumberInput
          {...ctx.subject}
          label="Sample count"
          defaultValue={123456789012345}
          suffix="items"
          step="any"
        />
      </Example>
      <Example title="Abbreviated unit">
        <NumberInput
          {...ctx.subject}
          label="Transfer rate in megabytes per second"
          defaultValue={128.5}
          suffix="MB/s"
          min={0}
          step={0.5}
          description={<bdi>Set the maximum rate for background transfers.</bdi>}
        />
      </Example>
      <Example title="Storage and quota">
        <NumberInput
          {...ctx.subject}
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
        <NumberInput
          {...ctx.subject}
          label="Item count"
          defaultValue={123456}
          min={0}
          width="auto"
        />
      </Example>
      <Example title="Signed temperature">
        <NumberInput
          {...ctx.subject}
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
    <div className="number-demo-stack-proto">
      <NumberInput
        {...ctx.subject}
        label="Snapshot interval in seconds"
        defaultValue={30}
        min={5}
        max={120}
        step={5}
        suffix="s"
      />
      <NumberInput
        {...ctx.subject}
        variant="ghost"
        label="Inline threshold in percent"
        defaultValue={75}
        min={0}
        max={100}
        suffix="%"
      />
      <NumberInput
        {...ctx.subject}
        label="Requested capacity"
        defaultValue={125}
        min={1}
        max={50}
        status="danger"
        previewState="keyboard-focus"
        message={<bdi>Enter 50 or less.</bdi>}
      />
    </div>
  );
  return ctx.surface === 'overlay' ? (
    <div className="number-material-proto unica-overlay-surface" data-surface="overlay">
      {fields}
    </div>
  ) : (
    <div className="number-material-proto" data-surface="base">
      {fields}
    </div>
  );
}
