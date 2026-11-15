import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { BellIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { defineSpecimen } from '../../workbench/types.js';
import { Button } from '../button/button.proto.js';
import { Switch, SwitchGroup } from './binary-controls.proto.js';
import { Sample, SurfacePair } from './binary-controls.examples.js';

function Sizes(): ReactElement {
  return (
    <div className="binary-demo-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="binary-demo-size" key={size}>
          <span className="binary-demo-caption">
            {size.toUpperCase()} ·{' '}
            {size === 's'
              ? '40 × 22px / 18px thumb'
              : size === 'm'
                ? '44 × 24px / 20px thumb'
                : '52 × 28px / 24px thumb'}
          </span>
          <div className="binary-demo-row">
            <Switch size={size} label="Email alerts" />
            <Switch size={size} label="Background sync" defaultChecked />
            <Switch size={size} label="Activity alerts" thumbIcon={BellIcon} defaultChecked />
          </div>
        </div>
      ))}
    </div>
  );
}
function Interaction(): ReactElement {
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
          <Switch aria-label={`${state} off`} previewState={state} />
          <Switch aria-label={`${state} on`} defaultChecked previewState={state} />
        </div>
      ))}
    </div>
  );
}
function Availability(): ReactElement {
  return (
    <div className="binary-demo-grid">
      <Sample title="Read-only">
        <Switch
          label="Automatic backups"
          description="Required by your organization."
          defaultChecked
          readOnly
        />
        <Switch label="Public links" description="Managed by an administrator." readOnly />
      </Sample>
      <Sample title="Disabled">
        <Switch label="Automatic backups" defaultChecked disabled />
        <Switch label="Public links" description="Available after verification." disabled />
      </Sample>
      <Sample title="Pending keeps the committed value">
        <Switch label="Email notifications" description="Turning notifications on…" loading />
        <Switch
          label="Email notifications"
          description="Turning notifications off…"
          loading
          defaultChecked
        />
      </Sample>
      <Sample title="Availability intersections">
        <Switch
          label="Policy sync"
          description="Synchronizing the read-only setting…"
          defaultChecked
          readOnly
          loading
        />
        <Switch
          label="Unavailable sync"
          description="Disabled suppresses pending decoration."
          defaultChecked
          disabled
          loading
          thumbIcon={BellIcon}
        />
      </Sample>
    </div>
  );
}
function FeedbackSizes(): ReactElement {
  return (
    <div className="binary-demo-stack">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="binary-demo-row" key={size}>
          <Switch size={size} label={`${size.toUpperCase()} · turning on…`} loading />
          <Switch
            size={size}
            label={`${size.toUpperCase()} · turning off…`}
            defaultChecked
            loading
          />
        </div>
      ))}
    </div>
  );
}
function AsyncSetting(): ReactElement {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<boolean | null>(null);
  const [result, setResult] = useState<'idle' | 'saved' | 'error'>('idle');
  const id = useId();
  return (
    <div className="binary-demo-narrow binary-demo-stack">
      <Switch
        label="Email notifications"
        checked={saved}
        loading={pending !== null}
        thumbIcon={BellIcon}
        aria-describedby={id}
        onCheckedChange={(next) => {
          setResult('idle');
          setPending(next);
        }}
        description="Receive a message when a followed item changes."
      />
      <div
        id={id}
        role={result === 'error' ? 'alert' : 'status'}
        className={result === 'error' ? 'binary-demo-message' : 'binary-demo-caption'}
      >
        {result === 'error' && <WarningCircleIcon size={16} />}
        <span>
          {pending !== null
            ? `Turning notifications ${pending ? 'on' : 'off'}…`
            : result === 'error'
              ? `Could not save. Notifications are still ${saved ? 'on' : 'off'}. Activate the switch to retry.`
              : result === 'saved'
                ? `Saved. Notifications are ${saved ? 'on' : 'off'}.`
                : 'Try the switch, then choose the simulated response below.'}
        </span>
      </div>
      <div className="binary-demo-action-row">
        <Button
          size="s"
          variant="secondary"
          disabled={pending === null}
          onClick={() => {
            if (pending !== null) {
              setSaved(pending);
            }
            setPending(null);
            setResult('saved');
          }}
        >
          Succeed
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={pending === null}
          onClick={() => {
            setPending(null);
            setResult('error');
          }}
        >
          Fail
        </Button>
      </div>
    </div>
  );
}
function Groups(): ReactElement {
  const id = useId();
  const [enabled, setEnabled] = useState(true);
  return (
    <div className="binary-demo-grid">
      <Sample title="Independent settings">
        <SwitchGroup aria-label="Notification preferences" defaultValue={['mentions']}>
          <Switch
            value="mentions"
            label="Mentions"
            description="When someone mentions you directly."
          />
          <Switch
            value="comments"
            label="Replies"
            description="When a conversation receives a reply."
          />
          <Switch
            value="updates"
            label="Followed items"
            description="When a followed item changes."
          />
        </SwitchGroup>
      </Sample>
      <Sample title="Trailing control in a setting row">
        <div className="binary-demo-setting">
          <div className="binary-demo-field">
            <label className="binary-demo-legend" id={`${id}-label`} htmlFor={id}>
              Show reading progress
            </label>
            <span className="binary-demo-caption" id={`${id}-help`}>
              Resume from the last section you read.
            </span>
          </div>
          <Switch
            id={id}
            checked={enabled}
            onCheckedChange={setEnabled}
            aria-labelledby={`${id}-label`}
            aria-describedby={`${id}-help`}
          />
        </div>
      </Sample>
    </div>
  );
}
function Overflow(): ReactElement {
  return (
    <div className="binary-demo-narrow binary-demo-stack">
      <Switch
        label="Notify the owner before a recurring review expires"
        description="The track stays centered on the first line, even when the description needs several lines."
        defaultChecked
      />
      <Switch size="s" label="Automatically include updates from every followed collection" />
      <Switch
        size="l"
        label="Keep a local copy of attachments for offline reading"
        defaultChecked
      />
      <Switch label="Enable_notifications_for_external_collaborators_and_reviewers" />
      <Switch aria-label="Background sync" defaultChecked />
    </div>
  );
}
export default defineSpecimen({
  id: 'switch',
  title: 'Switch',
  group: 'Forms',
  summary: 'Immediate settings, stable thumb polarity, and honest pending feedback.',
  sections: [
    { id: 'sizes', title: 'Size & anatomy', kind: 'matrix', render: () => <Sizes /> },
    {
      id: 'interaction',
      title: 'Interaction states',
      kind: 'states',
      caption:
        'Pinned appearances, live switches. Space or a single Enter toggles; the setting label stays constant.',
      render: () => <Interaction />,
    },
    {
      id: 'availability',
      title: 'Availability & pending',
      kind: 'states',
      caption:
        'Pending examples are pinned. The live save example below demonstrates success, failure, and retry.',
      render: () => <Availability />,
    },
    {
      id: 'feedback',
      title: 'Pending at every size',
      kind: 'states',
      render: () => <FeedbackSizes />,
    },
    {
      id: 'live',
      title: 'Save, fail & retry',
      kind: 'context',
      caption:
        'Local response harness, not a network service. Pending retains the committed state and focus; Succeed/Fail explicitly resolve it.',
      render: () => <AsyncSetting />,
    },
    { id: 'group', title: 'Settings & alignment', kind: 'context', render: () => <Groups /> },
    { id: 'overflow', title: 'Labels & density', kind: 'states', render: () => <Overflow /> },
    {
      id: 'surfaces',
      title: 'Base & overlay',
      kind: 'context',
      caption: 'Static material plates with live controls.',
      render: () => (
        <SurfacePair>
          <Switch label="Email notifications" />
          <Switch label="Background sync" defaultChecked />
          <Switch label="Activity alerts" thumbIcon={BellIcon} defaultChecked />
        </SurfacePair>
      ),
    },
  ],
});
