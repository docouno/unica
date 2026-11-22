import { size, disabled, readOnly, loading, toggle, eventProp } from '../control-props.js';
import { useEffect, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { BellIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { defineComponent } from '../../workbench/types.js';
import { Checkbox, Switch, SwitchGroup } from '@docouno/unica';
import { Sample, SurfacePair } from '../binary-examples.js';

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
            <Switch size={size} label="Activity alerts" thumbIcon={<BellIcon />} defaultChecked />
          </div>
        </div>
      ))}
    </div>
  );
}
function Interaction(): ReactElement {
  return (
    <div className="binary-demo-row">
      <Switch label="Email alerts" />
      <Switch label="Background sync" defaultChecked />
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
          thumbIcon={<BellIcon />}
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
  const [failNextSave, setFailNextSave] = useState(false);
  const [pending, setPending] = useState<{
    readonly value: boolean;
    readonly fail: boolean;
  } | null>(null);
  const [result, setResult] = useState<'idle' | 'saved' | 'error'>('idle');
  const id = useId();

  useEffect(() => {
    if (pending === null) {
      return;
    }
    const response = window.setTimeout(() => {
      if (!pending.fail) {
        setSaved(pending.value);
      }
      setPending(null);
      setResult(pending.fail ? 'error' : 'saved');
    }, 1000);
    return () => window.clearTimeout(response);
  }, [pending]);

  return (
    <div className="binary-demo-narrow binary-demo-stack">
      <Checkbox
        label="Fail the next save"
        checked={failNextSave}
        onCheckedChange={setFailNextSave}
      />
      <div className="binary-demo-field">
        <Switch
          label="Email notifications"
          checked={saved}
          loading={pending !== null}
          thumbIcon={<BellIcon />}
          aria-describedby={id}
          onCheckedChange={(next: boolean) => {
            setResult('idle');
            setPending({ value: next, fail: failNextSave });
            setFailNextSave(false);
          }}
          description="Receive a message when a followed item changes."
        />
        <div
          id={id}
          role="status"
          className={result === 'error' ? 'binary-demo-message' : 'binary-demo-caption'}
        >
          {result === 'error' && <WarningCircleIcon size={16} aria-hidden="true" />}
          <span>
            {pending !== null
              ? `Turning notifications ${pending.value ? 'on' : 'off'}…`
              : result === 'error'
                ? `Could not save. Notifications are still ${saved ? 'on' : 'off'}. Activate the switch to retry.`
                : result === 'saved'
                  ? `Saved. Notifications are ${saved ? 'on' : 'off'}.`
                  : ''}
          </span>
        </div>
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
            className="binary-demo-setting-control"
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
export default defineComponent({
  id: 'switch',
  title: 'Switch',
  category: 'Forms',
  status: 'UI',
  summary: 'Immediate settings with a focusable pending state.',
  componentName: 'Switch',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    loading,
    defaultChecked: {
      ...toggle('Selection', 'Starts with notifications on.', true),
      demo: true,
    },
    thumbIcon: {
      kind: 'slot',
      group: 'Content',
      description: 'A decorative icon in the thumb.',
      choices: [
        { value: '', label: 'None' },
        { value: 'bell', label: 'Bell', code: '<BellIcon />' },
      ],
      default: '',
    },
    description: {
      kind: 'string',
      group: 'Content',
      description: 'Supporting text for the notifications setting.',
      default: '',
    },
    onCheckedChange: eventProp('Reports whether notifications are on.', 'handleCheckedChange'),
  },
  constraints: [
    {
      kind: 'ignored',
      when: { disabled: true },
      affects: [{ key: 'loading', value: true }],
      reason: 'The disabled state suppresses the pending indicator.',
    },
    {
      kind: 'precedence',
      when: { disabled: true },
      affects: [
        { key: 'readOnly', value: true },
        { key: 'thumbIcon', value: 'bell' },
      ],
      reason: 'A disabled switch leaves the tab order and hides its thumb icon.',
    },
    {
      kind: 'precedence',
      when: { loading: true, disabled: false },
      affects: [{ key: 'thumbIcon', value: 'bell' }],
      reason: 'A pending indicator fills the thumb icon slot.',
    },
  ],
  render: ({ values: { defaultChecked, thumbIcon, ...props }, ctx }) => (
    <form {...ctx.form}>
      <div {...ctx.subject} className="binary-demo-subject">
        <Switch
          key={String(defaultChecked)}
          {...props}
          label="Notifications"
          defaultChecked={defaultChecked}
          name="notifications"
          thumbIcon={thumbIcon === 'bell' ? <BellIcon /> : undefined}
          onCheckedChange={ctx.action('onCheckedChange')}
        />
      </div>
    </form>
  ),
  code: ({ defaultChecked }, attributes) =>
    `<Switch label="Notifications" name="notifications"${defaultChecked ? ' defaultChecked' : ''}${attributes} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'loading',
      title: 'Size & anatomy',
      reference: () => <Sizes />,
    },
    { id: 'pending', rows: 'defaultChecked', cols: 'loading', title: 'Value during pending' },
  ],
  cases: [
    {
      id: 'interaction',
      title: 'Interaction states',
      caption:
        'Tab to a switch or hold the pointer button over its label. Space or a single Enter toggles the setting.',
      kind: 'behavior',
      mode: 'live',
      render: () => <Interaction />,
    },
    {
      id: 'availability',
      title: 'Availability & pending',
      caption:
        'These examples hold their pending state. Use Save, fail & retry to see the result of a request.',
      kind: 'behavior',
      render: () => <Availability />,
    },
    {
      id: 'feedback',
      title: 'Pending at every size',
      kind: 'behavior',
      mode: 'pinned',
      render: () => <FeedbackSizes />,
    },
    {
      id: 'live',
      title: 'Save, fail & retry',
      caption:
        'Toggle notifications to simulate a save. To see a failure, select Fail the next save first, then toggle notifications and retry.',
      kind: 'behavior',
      mode: 'live',
      render: () => <AsyncSetting />,
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
      caption: 'Static material plates with live controls.',
      kind: 'surface',
      render: () => (
        <SurfacePair>
          <Switch label="Email notifications" />
          <Switch label="Background sync" defaultChecked />
          <Switch label="Activity alerts" thumbIcon={<BellIcon />} defaultChecked />
        </SurfacePair>
      ),
    },
  ],
  usage: [
    {
      id: 'group',
      title: 'Settings & alignment',
      code: `<SwitchGroup aria-label="Notification preferences" defaultValue={['mentions']}>
  <Switch value="mentions" label="Mentions" />
  <Switch value="comments" label="Replies" />
  <Switch value="updates" label="Followed items" />
</SwitchGroup>`,
      render: () => <Groups />,
    },
  ],
});
