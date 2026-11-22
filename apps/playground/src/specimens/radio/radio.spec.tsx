import { size, disabled, readOnly, required, choice, eventProp } from '../control-props.js';
import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Button } from '@docouno/unica';
import { Radio, RadioGroup } from '@docouno/unica';
import { Sample, SurfacePair } from '../binary-examples.js';

function Sizes(): ReactElement {
  return (
    <div className="binary-demo-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="binary-demo-size" key={size}>
          <span className="binary-demo-caption">
            {size.toUpperCase()} ·{' '}
            {size === 's'
              ? '16px / 30px row'
              : size === 'm'
                ? '20px / 40px row'
                : '24px / 48px row'}
          </span>
          <RadioGroup
            aria-label={`${size} delivery`}
            orientation="horizontal"
            size={size}
            defaultValue="weekly"
          >
            <Radio value="daily" label="Daily" />
            <Radio value="weekly" label="Weekly" />
            <Radio value="monthly" label="Monthly" />
          </RadioGroup>
        </div>
      ))}
    </div>
  );
}
function Interaction(): ReactElement {
  return (
    <RadioGroup aria-label="Delivery frequency" orientation="horizontal" defaultValue="weekly">
      <Radio value="daily" label="Daily" />
      <Radio value="weekly" label="Weekly" />
      <Radio value="monthly" label="Monthly" />
    </RadioGroup>
  );
}
function Availability(): ReactElement {
  return (
    <div className="binary-demo-grid">
      <Sample title="Read-only is a group decision">
        <RadioGroup aria-label="Managed retention" readOnly defaultValue="90">
          <Radio value="30" label="30 days" />
          <Radio
            value="90"
            label="90 days"
            description="Retention is managed by your organization."
          />
        </RadioGroup>
      </Sample>
      <Sample title="Disabled group">
        <RadioGroup aria-label="Unavailable retention" disabled defaultValue="90">
          <Radio value="30" label="30 days" />
          <Radio
            value="90"
            label="90 days"
            description="Available after the workspace is verified."
          />
        </RadioGroup>
      </Sample>
      <Sample title="Unavailable option, available alternatives">
        <RadioGroup aria-label="Delivery channel" defaultValue="email">
          <Radio value="email" label="Email" />
          <Radio
            value="chat"
            label="Team chat"
            description="Connect a channel to use this option."
            disabled
          />
          <Radio value="inbox" label="Inbox" />
        </RadioGroup>
      </Sample>
      <Sample title="Selected option becomes unavailable">
        <RadioGroup aria-label="Existing delivery channel" defaultValue="chat">
          <Radio
            value="chat"
            label="Team chat"
            description="This connection is no longer available. Choose a replacement."
            disabled
          />
          <Radio value="email" label="Email" />
          <Radio value="inbox" label="Inbox" />
        </RadioGroup>
      </Sample>
    </div>
  );
}
function Choices(): ReactElement {
  const id = useId();
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="binary-demo-grid">
      <div className="binary-demo-field">
        <span className="binary-demo-legend" id={id}>
          Delivery schedule
        </span>
        <RadioGroup aria-labelledby={id} value={selected} onValueChange={setSelected}>
          <Radio
            value="immediate"
            label="As events happen"
            description="Receive each update immediately."
          />
          <Radio
            value="daily"
            label="Daily summary"
            description="Combine updates into one message each morning."
          />
          <Radio
            value="none"
            label="No email"
            description="Updates remain available in your inbox."
          />
        </RadioGroup>
        <span className="binary-demo-caption" role="status">
          {selected === null ? 'No choice made yet.' : `Selected: ${selected}.`}
        </span>
        <div className="binary-demo-action-row">
          <Button variant="ghost" tone="neutral" size="s" onClick={() => setSelected(null)}>
            Reset example
          </Button>
        </div>
      </div>
      <Sample title="Horizontal flow wraps without shrinking choices">
        <RadioGroup aria-label="Date display" orientation="horizontal" defaultValue="relative">
          <Radio value="relative" label="Relative dates" />
          <Radio value="absolute" label="Absolute dates" />
          <Radio value="system" label="System preference" />
        </RadioGroup>
      </Sample>
    </div>
  );
}
function Validation(): ReactElement {
  const [selected, setSelected] = useState<string | null>(null);
  const [attempted, setAttempted] = useState(false);
  const id = useId();
  const invalid = attempted && selected === null;
  return (
    <div className="binary-demo-grid">
      <form
        className="binary-demo-field"
        onInvalid={() => setAttempted(true)}
        onSubmit={(event) => event.preventDefault()}
      >
        <span className="binary-demo-legend" id={id}>
          Default visibility
        </span>
        <RadioGroup
          aria-labelledby={id}
          aria-describedby={invalid ? `${id}-error` : undefined}
          name="visibility"
          required
          value={selected}
          onValueChange={setSelected}
          status={invalid ? 'danger' : 'neutral'}
        >
          <Radio value="private" label="Private" />
          <Radio value="team" label="Team" />
        </RadioGroup>
        {invalid && (
          <span className="binary-demo-message" id={`${id}-error`} role="alert">
            <WarningCircleIcon size={16} aria-hidden="true" />
            Choose a visibility setting.
          </span>
        )}
        <div className="binary-demo-action-row">
          <Button variant="secondary" tone="accent" size="s" type="submit">
            Check selection
          </Button>
        </div>
      </form>
      <Sample title="Invalid selected value">
        <RadioGroup aria-label="Invalid visibility" status="danger" defaultValue="public">
          <Radio
            value="public"
            label="Public"
            description="Public access conflicts with the current policy."
          />
          <Radio value="team" label="Team only" />
        </RadioGroup>
      </Sample>
    </div>
  );
}
function Overflow(): ReactElement {
  return (
    <div className="binary-demo-narrow">
      <RadioGroup aria-label="Notification detail" defaultValue="all">
        <Radio
          value="all"
          label="Include every update from collections this team can access"
          description="The dot stays centered on the first label line. Supporting text stays beneath the label."
        />
        <Radio
          value="summary"
          label="Send one summary with mentions, comments, and changes that need attention"
        />
        <Radio value="custom" label="Use_workspace_notification_preferences_without_overrides" />
      </RadioGroup>
      <RadioGroup
        size="s"
        aria-label="Compact display"
        orientation="horizontal"
        defaultValue="comfortable"
      >
        <Radio value="compact" label="Compact" />
        <Radio value="comfortable" label="Comfortable" />
      </RadioGroup>
      <RadioGroup size="l" aria-label="Touch display" defaultValue="all">
        <Radio value="all" label="Show descriptions beneath each option" />
        <Radio value="labels" label="Show labels only" />
      </RadioGroup>
    </div>
  );
}
function SurfaceChoices(): ReactElement {
  return (
    <RadioGroup aria-label="Visibility" defaultValue="team">
      <Radio value="private" label="Private" />
      <Radio value="team" label="Team" />
      <Radio value="public" label="Public" />
    </RadioGroup>
  );
}
export default defineComponent({
  id: 'radio',
  title: 'Radio',
  category: 'Forms',
  status: 'UI',
  summary: 'One choice from a named group of visible options.',
  componentName: 'RadioGroup',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    required,
    selection: {
      kind: 'enum',
      group: 'Selection',
      label: 'Initial selection',
      description: 'Sets the starting choice restored by a form reset.',
      choices: [
        { value: '', label: 'No choice yet' },
        { value: 'daily', label: 'Daily' },
        { value: 'weekly', label: 'Weekly' },
      ],
      default: 'daily',
      demo: true,
    },
    status: choice('Field', 'Validation state of the group.', ['neutral', 'danger'], 'neutral'),
    orientation: choice(
      'Geometry',
      'Stack choices or place them side by side.',
      ['vertical', 'horizontal'],
      'vertical',
    ),
    onValueChange: eventProp('Reports the selected delivery option.', 'handleValueChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'status', value: 'danger' }],
      reason: 'Disabled groups suppress invalid styling and semantics.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'required', value: true },
      ],
      reason: 'Disabled groups are excluded from focus, validation, and submission.',
    },
  ],
  render: ({ values: { selection, ...props }, ctx }) => (
    <form {...ctx.form}>
      <RadioGroup
        key={selection}
        {...props}
        {...ctx.subject}
        name="delivery"
        defaultValue={selection || null}
        aria-label="Delivery frequency"
        onValueChange={ctx.action('onValueChange')}
      >
        <Radio value="daily" label="Daily" />
        <Radio value="weekly" label="Weekly" />
      </RadioGroup>
    </form>
  ),
  code: ({ selection }, attributes) =>
    `<RadioGroup aria-label="Delivery frequency" name="delivery" defaultValue={${JSON.stringify(selection || null)}}${attributes}>
  <Radio value="daily" label="Daily" />
  <Radio value="weekly" label="Weekly" />
</RadioGroup>`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'orientation',
      title: 'Size & selection',
      reference: () => <Sizes />,
    },
    { id: 'selection', rows: 'selection', cols: 'required', title: 'Selection & required' },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Interaction states',
      caption:
        'Tab enters the group. Use the arrow keys to move the choice, or point at a label and hold the pointer button to inspect press.',
      kind: 'behavior',
      mode: 'live',
      render: () => <Interaction />,
    },
    {
      id: 'availability',
      title: 'Availability',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'validation',
      title: 'Validation',
      caption:
        'Submit without a choice to see the required-group error. A selection clears it. Tab to the invalid selected value to inspect its focus ring.',
      kind: 'behavior',
      mode: 'live',
      render: () => <Validation />,
    },
    {
      id: 'overflow',
      title: 'Labels & density',
      kind: 'content',
      render: () => <Overflow />,
    },
    {
      id: 'surfaces',
      title: 'Base & overlay',
      caption: 'Static material plates with independent live groups.',
      kind: 'surface',
      render: () => (
        <SurfacePair>
          <SurfaceChoices />
        </SurfacePair>
      ),
    },
  ],
  usage: [
    {
      id: 'group',
      title: 'Groups & empty selection',
      caption:
        'Tab enters the group; arrows move selection. Space selects; Home/End choose the first/last available option. Selecting the chosen option never clears it.',
      mode: 'live',
      code: `<RadioGroup aria-label="Delivery schedule" value={selected} onValueChange={setSelected}>
  <Radio value="immediate" label="As events happen" />
  <Radio value="daily" label="Daily summary" />
  <Radio value="none" label="No email" />
</RadioGroup>`,
      render: () => <Choices />,
    },
  ],
});
