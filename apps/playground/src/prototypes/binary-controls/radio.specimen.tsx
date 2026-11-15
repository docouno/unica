import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Radio, RadioGroup } from './binary-controls.proto.js';
import { Sample, SurfacePair } from './binary-controls.examples.js';

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
  const id = useId();
  return (
    <div>
      {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
        <div className="binary-demo-state" data-columns="2" key={state}>
          <span className="binary-demo-caption">
            {state === 'focus'
              ? 'Keyboard focus'
              : state === 'active'
                ? 'Pressed'
                : state === 'hover'
                  ? 'Hover'
                  : 'Rest'}
          </span>
          <Radio aria-label={`${state} unselected`} name={`${id}-${state}`} previewState={state} />
          <Radio
            aria-label={`${state} selected`}
            name={`${id}-${state}`}
            defaultChecked
            previewState={state}
          />
        </div>
      ))}
    </div>
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
      <div className="binary-demo-field">
        <span className="binary-demo-legend" id={id}>
          Default visibility
        </span>
        <RadioGroup
          aria-labelledby={id}
          aria-describedby={invalid ? `${id}-error` : undefined}
          value={selected}
          onValueChange={setSelected}
          status={invalid ? 'danger' : 'neutral'}
        >
          <Radio value="private" label="Private" />
          <Radio value="team" label="Team" />
        </RadioGroup>
        {invalid && (
          <span className="binary-demo-message" id={`${id}-error`} role="alert">
            <WarningCircleIcon size={16} />
            Choose a visibility setting.
          </span>
        )}
        <div className="binary-demo-action-row">
          <Button variant="secondary" size="s" onClick={() => setAttempted(true)}>
            Check selection
          </Button>
        </div>
      </div>
      <Sample title="Pinned invalid selection with keyboard focus">
        <RadioGroup aria-label="Invalid visibility" status="danger" defaultValue="public">
          <Radio
            value="public"
            label="Public"
            description="Public access conflicts with the current policy."
            previewState="focus"
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
export default defineSpecimen({
  id: 'radio',
  title: 'Radio',
  group: 'Forms',
  summary:
    'One deliberate choice, visible alternatives, and circular indicators in every material.',
  sections: [
    { id: 'sizes', title: 'Size & selection', kind: 'matrix', render: () => <Sizes /> },
    {
      id: 'interaction',
      title: 'Interaction states',
      kind: 'states',
      caption: 'Pinned appearances; live native radio pairs. Focus pins do not move actual focus.',
      render: () => <Interaction />,
    },
    { id: 'availability', title: 'Availability', kind: 'states', render: () => <Availability /> },
    {
      id: 'group',
      title: 'Groups & empty selection',
      kind: 'context',
      caption:
        'Tab enters the group; arrows move selection. Space selects; Home/End choose the first/last available option. Selecting the chosen option never clears it.',
      render: () => <Choices />,
    },
    {
      id: 'validation',
      title: 'Validation',
      kind: 'states',
      caption:
        'Check selection reveals the error; a choice clears it. The neighboring invalid selection is a pinned review case.',
      render: () => <Validation />,
    },
    { id: 'overflow', title: 'Labels & density', kind: 'states', render: () => <Overflow /> },
    {
      id: 'surfaces',
      title: 'Base & overlay',
      kind: 'context',
      caption: 'Static material plates with independent live groups.',
      render: () => (
        <SurfacePair>
          <SurfaceChoices />
        </SurfacePair>
      ),
    },
  ],
});
