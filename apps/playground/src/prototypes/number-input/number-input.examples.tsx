import { FormField } from '../form-field/form-field.proto.js';
import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Button } from '@docouno/unica';
import { Input } from '@docouno/unica';
import type { FieldStatus, FieldVariant } from '@docouno/unica';
import { NumberInput } from './number-input.proto.js';
import './number-input.examples.css';

function Example({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="number-example-proto">
      <div className="number-example-title-proto">{title}</div>
      {children}
    </div>
  );
}

export function NumberRoles(): ReactElement {
  return (
    <div className="number-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={variant === 'default' ? 'Default · form slot' : 'Ghost · inline editing'}
        >
          <div className="number-demo-stack-proto">
            {(['s', 'm', 'l'] as const).map((size) => (
              <NumberInput
                key={size}
                size={size}
                variant={variant}
                label={`${size.toUpperCase()} · Quantity`}
                defaultValue={12}
                min={0}
                max={99}
              />
            ))}
            <NumberInput
              variant={variant}
              label="Optional limit"
              placeholder="No limit"
              min={0}
              suffix="items"
              description="Empty means no limit. A step begins from zero."
            />
          </div>
        </Example>
      ))}
    </div>
  );
}

export function NumberAnatomy(): ReactElement {
  const id = useId();
  return (
    <div className="number-examples-proto">
      <Example title="An amount">
        <NumberInput
          label="Unit price"
          prefix="$"
          suffix="USD"
          defaultValue={24.5}
          min={0}
          step={0.5}
          description="Units stay outside the editable number."
        />
      </Example>
      <Example title="Signed decimal">
        <NumberInput
          label="Exposure adjustment"
          defaultValue={-1.25}
          min={-5}
          max={5}
          step={0.25}
          suffix="EV"
          description="Negative values retain their reading order in RTL."
        />
      </Example>
      <Example title="Intrinsic width · units, status & checking">
        <NumberInput
          label="Reserved capacity"
          prefix="≈"
          defaultValue={64}
          suffix="GiB"
          width="auto"
          status="warning"
          loading
          message="Checking capacity; 64 GiB is close to the quota."
        />
      </Example>
      <Example title="Compact intrinsic width">
        <NumberInput
          label="Copies"
          defaultValue={2}
          min={1}
          max={9}
          width="auto"
          description="An 8ch content basis, with an action at each edge."
        />
      </Example>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Example key={size} title={`${size.toUpperCase()} · shared control rhythm`}>
          <div className="number-size-comparison-proto">
            <FormField htmlFor={`${id}-reference-${size}`} label="Reference" size={size}>
              <Input id={`${id}-reference-${size}`} size={size} defaultValue="Document" />
            </FormField>
            <NumberInput
              size={size}
              aria-label={`${size} copies`}
              defaultValue={2}
              min={1}
              max={9}
            />
            <Button size={size} variant="secondary" tone="neutral">
              Apply
            </Button>
          </div>
        </Example>
      ))}
    </div>
  );
}

export function NumberInteraction(): ReactElement {
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
      <Example title="Live · click, Tab, arrow keys, hold">
        <NumberInput
          label="Quantity"
          defaultValue={12}
          min={0}
          max={99}
          description="Tab to the editor. Use ↑ / ↓ or hold a button. Wheel scrolling leaves the value alone."
        />
      </Example>
    </div>
  );
}

const feedback: readonly [FieldStatus, string, string][] = [
  ['neutral', 'Standard limit', 'Choose a limit from 1 to 50.'],
  ['info', 'Recommended limit', 'A limit of 12 suits most workloads.'],
  ['success', 'Capacity confirmed', '12 workers fit the available capacity.'],
  ['warning', 'Near the quota', 'This leaves little room for another workload.'],
  ['danger', 'Limit exceeds capacity', 'Enter 50 or less, or decrease to 50.'],
];
export function NumberFeedback(): ReactElement {
  return (
    <div className="number-examples-proto">
      {(['default', 'ghost'] as const).map((variant) => (
        <Example
          key={variant}
          title={
            variant === 'default'
              ? 'Default · edge, shape, explanation'
              : 'Ghost · baseline, shape, explanation'
          }
        >
          <div className="number-demo-stack-proto">
            {feedback.map(([status, label, message]) => (
              <NumberInput
                key={status}
                label={label}
                variant={variant}
                status={status}
                defaultValue={status === 'danger' ? 125 : 12}
                min={1}
                max={50}
                message={message}
              />
            ))}
          </div>
        </Example>
      ))}
      <Example title="Status remains visible with focus">
        <div className="number-demo-stack-proto">
          <NumberInput
            label="Keyboard focus · danger"
            defaultValue={125}
            min={0}
            max={50}
            status="danger"
            previewState="keyboard-focus"
            message="Enter a number from 0 to 50."
          />
          <NumberInput
            label="Pointer focus · warning"
            defaultValue={48}
            min={0}
            max={50}
            status="warning"
            previewState="pointer-focus"
            message="Only 2 workers remain available."
          />
          <NumberInput
            variant="ghost"
            label="Ghost · keyboard focus · success"
            defaultValue={12}
            min={0}
            max={50}
            status="success"
            previewState="keyboard-focus"
            message="Capacity confirmed."
          />
        </div>
      </Example>
    </div>
  );
}

function AvailabilityColumn({ variant }: { readonly variant: FieldVariant }): ReactElement {
  return (
    <Example title={variant === 'default' ? 'Default' : 'Ghost'}>
      <div className="number-demo-stack-proto">
        <NumberInput
          variant={variant}
          label="Editable"
          defaultValue={12}
          suffix="s"
          min={5}
          max={120}
        />
        <NumberInput
          variant={variant}
          label="Read-only"
          defaultValue={30}
          suffix="s"
          readOnly
          description="Set by the workspace policy. You can copy this value."
        />
        <NumberInput
          variant={variant}
          label="Read-only · keyboard focus"
          defaultValue={30}
          suffix="s"
          readOnly
          previewState="keyboard-focus"
        />
        <NumberInput
          variant={variant}
          label="Disabled"
          defaultValue={30}
          suffix="s"
          disabled
          description="Enable scheduled snapshots to edit the interval."
        />
        <NumberInput
          variant={variant}
          label="Checking · still editable"
          defaultValue={30}
          suffix="s"
          loading
          message="Checking the interval…"
        />
        <NumberInput
          variant={variant}
          label="Read-only · loading"
          defaultValue={30}
          suffix="s"
          loading
          readOnly
          message="Applying the workspace policy…"
        />
        <NumberInput
          variant={variant}
          label="Warning · loading"
          defaultValue={110}
          min={5}
          max={120}
          suffix="s"
          status="warning"
          loading
          message="Checking whether this interval meets policy…"
        />
        <NumberInput
          variant={variant}
          label="Read-only · danger"
          defaultValue={125}
          max={120}
          suffix="s"
          status="danger"
          readOnly
          message="The policy exceeds the supported 120 s. Contact an administrator."
        />
        <NumberInput
          variant={variant}
          label="Disabled · status and loading suppressed"
          defaultValue={125}
          suffix="s"
          status="danger"
          loading
          disabled
          message="Unavailable while scheduled snapshots are off."
        />
      </div>
    </Example>
  );
}
export function NumberAvailability(): ReactElement {
  return (
    <div className="number-examples-proto">
      <AvailabilityColumn variant="default" />
      <AvailabilityColumn variant="ghost" />
    </div>
  );
}

function BoundaryExample({
  label,
  initial,
  min,
  max,
  step = 1,
  suffix,
}: {
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
      label={label}
      value={value}
      min={min}
      max={max}
      step={step}
      suffix={suffix}
      status={invalid ? 'danger' : 'neutral'}
      message={message}
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
export function NumberBounds(): ReactElement {
  return (
    <div className="number-examples-proto">
      <Example title="Only the outward action is unavailable">
        <div className="number-demo-stack-proto">
          <BoundaryExample label="At the minimum" initial={0} min={0} max={50} />
          <BoundaryExample label="At the maximum" initial={50} min={0} max={50} />
          <BoundaryExample label="One permitted value" initial={5} min={5} max={5} />
        </div>
      </Example>
      <Example title="Keep the entered value; explain the correction">
        <div className="number-demo-stack-proto">
          <BoundaryExample label="Above the maximum" initial={125} min={0} max={50} />
          <BoundaryExample label="Below the minimum" initial={-5} min={0} max={50} />
          <BoundaryExample label="Between steps" initial={12} min={0} max={50} step={5} />
          <BoundaryExample label="Maximum between steps" initial={12} min={0} max={12} step={5} />
        </div>
      </Example>
      <Example title="Empty, fractional, and negative domains">
        <div className="number-demo-stack-proto">
          <BoundaryExample label="Empty positive range" initial="" min={5} max={120} step={5} />
          <BoundaryExample label="Tenths" initial={0.2} min={0} max={1} step={0.1} />
          <BoundaryExample label="Negative decimal" initial={-1.25} min={-5} max={5} step={0.25} />
          <BoundaryExample label="Any precision" initial={0.25} step="any" />
          <BoundaryExample label="Negative range" initial="" min={-20} max={-5} step={5} />
        </div>
      </Example>
    </div>
  );
}

export function NumberLive(): ReactElement {
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
  return (
    <div className="number-examples-proto">
      <Example title="Local checking and correction">
        <div className="number-demo-stack-proto">
          <NumberInput
            label="Worker limit"
            required
            value={value}
            min={1}
            max={50}
            suffix="jobs"
            loading={state === 'checking'}
            status={state === 'rejected' ? 'danger' : state === 'accepted' ? 'success' : 'neutral'}
            description="Choose how many jobs can run at the same time."
            message={
              state === 'checking'
                ? 'Checking available capacity…'
                : state === 'accepted'
                  ? `${value} workers fit the available capacity.`
                  : state === 'rejected'
                    ? reason
                    : 'Enter 1 to 50. Check when you are ready.'
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
          <div className="number-demo-actions-proto">
            <Button size="s" variant="secondary" tone="neutral" onClick={check}>
              Check limit
            </Button>
            {state === 'checking' && (
              <>
                <Button
                  size="s"
                  variant="secondary"
                  tone="neutral"
                  onClick={() => setState('accepted')}
                >
                  Confirm capacity
                </Button>
                <Button
                  size="s"
                  variant="ghost"
                  tone="neutral"
                  onClick={() => {
                    setReason('Only 8 workers are available now. Enter 8 or fewer.');
                    setState('rejected');
                  }}
                >
                  Capacity changed
                </Button>
              </>
            )}
            <Button
              size="s"
              variant="ghost"
              tone="neutral"
              onClick={() => {
                setValue(12);
                setBad(false);
                setState('editing');
              }}
            >
              Restore example
            </Button>
          </div>
          <p className="number-demo-note-proto">
            Response buttons control this preview; there is no network request. A new edit clears a
            stale result.
          </p>
        </div>
      </Example>
      <Example title="Inline properties · external labels">
        <InlineProperties />
      </Example>
    </div>
  );
}

function InlineProperties(): ReactElement {
  const id = useId();
  return (
    <div className="number-inspector-proto">
      {(
        [
          ['Width', 320, 'px'],
          ['Height', 240, 'px'],
          ['Opacity', 80, '%'],
        ] as const
      ).map(([label, value, suffix], index) => (
        <div className="number-inspector-row-proto" key={label}>
          <label htmlFor={`${id}-${index}`}>{label}</label>
          <NumberInput
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
      <p className="number-demo-note-proto">Units and actions remain visible before interaction.</p>
    </div>
  );
}

export function NumberOverflow(): ReactElement {
  return (
    <div className="number-examples-proto">
      <Example title="Long labels and feedback">
        <NumberInput
          label="Maximum number of concurrent background export jobs"
          defaultValue={125}
          min={1}
          max={50}
          suffix="jobs"
          status="danger"
          message="This workspace supports up to 50 concurrent jobs. Keep the entered value visible while explaining how to correct it."
        />
      </Example>
      <Example title="Long number · native editing viewport">
        <NumberInput
          label="Sample count"
          defaultValue={123456789012345}
          suffix="items"
          step="any"
          description="Digits stay on one line. Focus and use the caret to inspect the whole number."
        />
      </Example>
      <Example title="Long unit · short visible abbreviation">
        <NumberInput
          label="Transfer rate in megabytes per second"
          defaultValue={128.5}
          suffix="MB/s"
          min={0}
          step={0.5}
          description="Put the full unit in the label; keep the affix short."
        />
      </Example>
      <Example title="Crowded slots · same actions">
        <NumberInput
          label="Allocated storage"
          prefix="≈"
          defaultValue={1024}
          suffix="GiB"
          status="warning"
          loading
          message="Checking quota. Status and busy feedback coexist."
        />
      </Example>
      <Example title="Intrinsic field in a narrow container">
        <NumberInput label="Item count" defaultValue={123456} min={0} width="auto" />
      </Example>
      <Example title="Direction follows the workbench">
        <NumberInput
          label="Temperature offset"
          defaultValue={-12.5}
          min={-40}
          max={40}
          suffix="°C"
          step={0.5}
          description="The signed decimal reads consistently when the shell is mirrored."
        />
      </Example>
    </div>
  );
}

function SurfaceFields(): ReactElement {
  return (
    <>
      <NumberInput
        label="Snapshot interval"
        defaultValue={30}
        min={5}
        max={120}
        step={5}
        suffix="s"
      />
      <NumberInput
        variant="ghost"
        label="Inline threshold"
        defaultValue={75}
        min={0}
        max={100}
        suffix="%"
      />
      <NumberInput
        label="Requested capacity"
        defaultValue={125}
        min={1}
        max={50}
        status="danger"
        previewState="keyboard-focus"
        message="Enter 50 or less."
      />
    </>
  );
}
export function NumberSurfaces(): ReactElement {
  return (
    <div className="number-examples-proto">
      <Example title="Base · ordinary form surface">
        <div className="number-material-proto" data-surface="base">
          <SurfaceFields />
        </div>
      </Example>
      <Example title="Overlay · static material plate">
        <div className="number-overlay-stage-proto">
          <div className="number-underlay-proto" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="number-material-proto" data-surface="overlay">
            <SurfaceFields />
          </div>
        </div>
      </Example>
    </div>
  );
}
