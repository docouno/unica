import {
  Checkbox,
  CheckboxGroup,
  FormField,
  Input,
  Radio,
  RadioCard,
  RadioCardGroup,
  RadioGroup,
  RangeSlider,
  Slider,
  Textarea,
  useFormField,
} from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

function TimeEditors({ groupError }: { groupError: boolean }) {
  const field = useFormField();
  return (
    <div
      role="group"
      aria-labelledby={field?.labelId}
      aria-describedby={[field?.descriptionId, groupError ? field?.messageId : undefined]
        .filter(Boolean)
        .join(' ')}
      aria-invalid={groupError || undefined}
    >
      <label>
        Start <input name="start" type="time" defaultValue="09:00" />
      </label>
      <label>
        End{' '}
        <input
          name="end"
          type="time"
          defaultValue="08:30"
          aria-describedby={groupError ? undefined : field?.messageId}
          aria-invalid={!groupError || undefined}
        />
      </label>
    </div>
  );
}

function LocalInput({ disabled }: { disabled: boolean }) {
  const field = useFormField();
  return (
    <Input
      disabled={disabled}
      name="local"
      defaultValue="Draft"
      aria-describedby={['external-copy', field?.messageId, 'external-copy']
        .filter(Boolean)
        .join(' ')}
    />
  );
}

function MountDetachedField({
  label,
  message,
  shadow = false,
  children,
}: {
  label: string;
  message: string;
  shadow?: boolean;
  children: ReactNode;
}) {
  const mounted = useRef<ReturnType<typeof createRoot>>(null);
  useEffect(() => () => mounted.current?.unmount(), []);
  return (
    <button
      type="button"
      onClick={(event) => {
        if (mounted.current) {
          return;
        }
        const doc = event.currentTarget.ownerDocument;
        const destination = shadow
          ? doc
              .querySelector('[data-testid="shadow-destination"]')
              ?.shadowRoot?.querySelector('fieldset')
          : doc.querySelector('[data-testid="fieldset-destination"]');
        const container = doc.createElement('div');
        const root = createRoot(container);
        mounted.current = root;
        flushSync(() => {
          root.render(
            <FormField label={label} status="danger" message={message}>
              {children}
            </FormField>,
          );
        });
        container.dataset.initialInvalid =
          container.querySelector('input')?.getAttribute('aria-invalid') ?? '';
        destination?.append(container);
      }}
    >
      Connect {label.toLowerCase()}
    </button>
  );
}

function DetachedCheckbox() {
  const [checked, setChecked] = useState(false);
  return <Checkbox name="accept" checked={checked} onCheckedChange={setChecked} />;
}

function BoundBudgetRange() {
  const field = useFormField();
  return (
    <RangeSlider
      defaultValue={[10, 90]}
      thumbLabels={['Low budget', 'High budget']}
      names={['low', 'high']}
      aria-describedby={['external-copy', field?.messageId].filter(Boolean).join(' ')}
    />
  );
}

export default function FieldContracts() {
  const [localDisabled, setLocalDisabled] = useState(true);
  const [ownerDisabled, setOwnerDisabled] = useState(false);
  const [fieldsetDisabled, setFieldsetDisabled] = useState(false);
  const [wrap, setWrap] = useState<'off' | 'soft'>('soft');
  const [groupError, setGroupError] = useState(false);
  const [width, setWidth] = useState(520);
  return (
    <main style={{ display: 'grid', gap: 16, padding: 16 }}>
      <div>
        <button type="button" onClick={() => setLocalDisabled(!localDisabled)}>
          Toggle local disabled
        </button>
        <button type="button" onClick={() => setOwnerDisabled(!ownerDisabled)}>
          Toggle field disabled
        </button>
        <button type="button" onClick={() => setFieldsetDisabled(!fieldsetDisabled)}>
          Toggle fieldset disabled
        </button>
        <button type="button" onClick={() => setWrap(wrap === 'off' ? 'soft' : 'off')}>
          Toggle wrapping
        </button>
        <button type="button" onClick={() => setGroupError(!groupError)}>
          Toggle group error
        </button>
        <MountDetachedField label="Detached slider" message="Choose a lower value.">
          <Slider />
        </MountDetachedField>
        <MountDetachedField label="Shadow slider" message="Choose a lower value." shadow>
          <Slider />
        </MountDetachedField>
        <MountDetachedField label="Shadow checkbox" message="Accept to continue." shadow>
          <DetachedCheckbox />
        </MountDetachedField>
        <button type="button" onClick={() => setWidth(width > 480 ? 294 : 520)}>
          Resize panel
        </button>
      </div>
      <div data-testid="shadow-destination" />
      <span id="external-copy">Outside hint.</span>
      <FormField
        data-testid="local-field"
        label="Local draft"
        disabled={ownerDisabled}
        status="danger"
        description="Help stays."
        message="Draft needs attention."
        counter={0}
      >
        <LocalInput disabled={!ownerDisabled && localDisabled} />
      </FormField>
      <fieldset data-testid="fieldset" disabled={fieldsetDisabled}>
        <legend>
          <FormField label="Legend editor" status="danger" message="Legend problem.">
            <Input />
          </FormField>
          <span data-testid="legend-destination" />
        </legend>
        <div data-testid="fieldset-destination" />
        <FormField
          data-testid="inherited-field"
          label="Inner notes"
          status="warning"
          description="Editing hint."
          message="Review these notes."
        >
          <Textarea wrap={wrap} defaultValue="Some notes." />
        </FormField>
        <FormField
          target="group"
          label="Review type"
          status="danger"
          message="Choose a review type."
        >
          <RadioGroup name="kind">
            <Radio value="private" label="Private review" />
            <Radio value="public" label="Public review" />
          </RadioGroup>
        </FormField>
        <FormField target="group" label="Review policy" status="danger" message="Choose a policy.">
          <RadioCardGroup name="policy">
            <RadioCard
              value="audit"
              label="Audit changes"
              secondary={<a href="#review-guide">Read the review guide</a>}
            />
          </RadioCardGroup>
        </FormField>
        <p id="review-guide">Reviewing changes</p>
      </fieldset>
      <form id="delivery" data-testid="delivery">
        <button type="submit">Save delivery settings</button>
        <button type="reset">Reset delivery settings</button>
      </form>
      <FormField target="group" label="Delivery methods" required description="Choose one or more.">
        <CheckboxGroup name="delivery" form="delivery" requiredMessage="Choose a delivery method.">
          <Checkbox value="email" label="Email" />
          <Checkbox value="app" label="In-app" />
        </CheckboxGroup>
      </FormField>
      <FormField label="Active" controlId="active-switch">
        <Checkbox />
      </FormField>
      <FormField label="Zoom level">
        <Slider name="zoom" />
      </FormField>
      <FormField
        data-testid="range-field"
        label="Budget range"
        target="group"
        description="Adjust both bounds."
        status="danger"
        message="This budget exceeds the allocation."
      >
        <BoundBudgetRange />
      </FormField>
      <FormField
        target="group"
        label="Review window"
        description="Use local time."
        status="danger"
        feedbackIcon={false}
        message={groupError ? 'This range overlaps another review.' : 'Choose a later end time.'}
      >
        <TimeEditors groupError={groupError} />
      </FormField>
      <div
        data-testid="layout-panel"
        style={{
          inlineSize: width,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <FormField
          orientation="horizontal"
          label="long-unbroken-address-label-with-application-instructions"
          labelAction={<button type="button">Read help</button>}
          description={<p>Use the short shared workspace code.</p>}
          status="danger"
          message="Choose a name that people can recognize across teams and workspaces."
          counter="12 / 126 characters"
          reserveMessage
        >
          <Input className="form-field-layout-editor" defaultValue="Research" dir="ltr" />
        </FormField>
      </div>
    </main>
  );
}
