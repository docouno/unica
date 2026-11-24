import { useEffect, useId, useState } from 'react';
import type { ReactElement } from 'react';
import { BellIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Divider, Flex, Icon, Stack, Switch, Text } from '@docouno/unica';
import type { SwitchProps } from '@docouno/unica';
import type { PreviewContext, PreviewProps } from '../../workbench/types.js';
import { BinaryPlate, Sample } from '../binary-examples.js';
import './switch.examples.css';

export function MeasuredSwitch({
  subject,
  description,
  ...props
}: SwitchProps & {
  readonly subject: PreviewContext['subject'];
}): ReactElement {
  // The native attributes target a transparent input. Measure the full visible label.
  return (
    <div {...subject} className="binary-demo-subject">
      <Switch
        {...props}
        description={
          typeof description === 'string' && description ? <bdi>{description}</bdi> : description
        }
      />
    </div>
  );
}

const densities = [
  { size: 's', track: '40 × 22', thumb: 18 },
  { size: 'm', track: '44 × 24', thumb: 20 },
  { size: 'l', track: '52 × 28', thumb: 24 },
] as const;

export function Sizes({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} divider={<Divider />}>
      {densities.map(({ size, track, thumb }) => (
        <Stack gap={8} key={size}>
          <Text size="caption-l" color="secondary">
            <bdi>
              {size.toUpperCase()} · {track}px track / {thumb}px thumb
            </bdi>
          </Text>
          <Flex wrap="wrap" align="start" gap={12}>
            <MeasuredSwitch subject={ctx.subject} size={size} label="Email alerts" />
            <MeasuredSwitch
              subject={ctx.subject}
              size={size}
              label="Background sync"
              defaultChecked
            />
            <MeasuredSwitch
              subject={ctx.subject}
              size={size}
              label="Activity alerts"
              thumbIcon={<BellIcon />}
              defaultChecked
            />
          </Flex>
        </Stack>
      ))}
    </Stack>
  );
}

export function Interaction({ ctx }: PreviewProps): ReactElement {
  return (
    <Flex wrap="wrap" align="start" gap={16}>
      <MeasuredSwitch subject={ctx.subject} label="Email alerts" />
      <MeasuredSwitch subject={ctx.subject} label="Background sync" defaultChecked />
    </Flex>
  );
}

export function Availability({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="binary-demo-grid">
      <Sample title="Read-only">
        <MeasuredSwitch
          subject={ctx.subject}
          label="Automatic backups"
          description="Required by your organization."
          defaultChecked
          readOnly
        />
        <MeasuredSwitch
          subject={ctx.subject}
          label="Public links"
          description="Managed by an administrator."
          readOnly
        />
      </Sample>
      <Sample title="Disabled">
        <MeasuredSwitch subject={ctx.subject} label="Automatic backups" defaultChecked disabled />
        <MeasuredSwitch
          subject={ctx.subject}
          label="Public links"
          description="Available after verification."
          disabled
        />
      </Sample>
      <Sample title="Pending change">
        <MeasuredSwitch
          subject={ctx.subject}
          label="Email notifications"
          description="Turning notifications on…"
          loading
        />
        <MeasuredSwitch
          subject={ctx.subject}
          label="Email notifications"
          description="Turning notifications off…"
          loading
          defaultChecked
        />
      </Sample>
      <Sample title="Restricted settings during a save">
        <MeasuredSwitch
          subject={ctx.subject}
          label="Policy sync"
          description="Synchronizing the read-only setting…"
          defaultChecked
          readOnly
          loading
        />
        <MeasuredSwitch
          subject={ctx.subject}
          label="Unavailable sync"
          description="Sync is unavailable for this account."
          defaultChecked
          disabled
          loading
          thumbIcon={<BellIcon />}
        />
      </Sample>
    </div>
  );
}

export function FeedbackSizes({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} divider={<Divider />}>
      {densities.map(({ size }) => (
        <Flex wrap="wrap" align="start" gap={12} key={size}>
          <MeasuredSwitch
            subject={ctx.subject}
            size={size}
            label={<bdi>{size.toUpperCase()} · turning on…</bdi>}
            loading
          />
          <MeasuredSwitch
            subject={ctx.subject}
            size={size}
            label={<bdi>{size.toUpperCase()} · turning off…</bdi>}
            defaultChecked
            loading
          />
        </Flex>
      ))}
    </Stack>
  );
}

export function AsyncSetting({ ctx }: PreviewProps): ReactElement {
  const [saved, setSaved] = useState(false);
  const [pending, setPending] = useState<{
    readonly value: boolean;
    readonly fail: boolean;
  } | null>(null);
  const [result, setResult] = useState<'idle' | 'saved' | 'error'>('idle');
  const id = useId();
  useEffect(() => {
    if (!pending) {
      return;
    }
    const response = window.setTimeout(() => {
      if (!pending.fail) {
        setSaved(pending.value);
      }
      setResult(pending.fail ? 'error' : 'saved');
      setPending(null);
    }, 1000);
    return () => window.clearTimeout(response);
  }, [pending]);

  const state = saved ? 'on' : 'off';
  const message = pending
    ? `Turning notifications ${pending.value ? 'on' : 'off'}…`
    : result === 'error'
      ? `Could not save. Notifications are still ${state}. Activate the switch to retry.`
      : result === 'saved'
        ? `Saved. Notifications are ${state}.`
        : '';
  return (
    <Stack gap={8} className="binary-demo-narrow">
      <MeasuredSwitch
        subject={ctx.subject}
        label="Email notifications"
        checked={saved}
        loading={pending !== null}
        thumbIcon={<BellIcon />}
        aria-describedby={id}
        description="Receive a message when a followed item changes."
        onCheckedChange={(next) => {
          const fail = ctx.story?.controls.fail === true;
          setResult('idle');
          setPending({ value: next, fail });
          if (fail) {
            ctx.story?.setControl('fail', false);
          }
        }}
      />
      <Flex align="start" gap={8} id={id} role="status">
        {result === 'error' && <Icon icon={WarningCircleIcon} size="s" color="danger" />}
        <Text size="caption-l" color={result === 'error' ? 'danger' : 'secondary'}>
          <bdi>{message}</bdi>
        </Text>
      </Flex>
    </Stack>
  );
}

export function Overflow({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={16} className="binary-demo-narrow">
      <MeasuredSwitch
        subject={ctx.subject}
        label="Notify the owner before a recurring review expires"
        description="Send a reminder three days before each review is due."
        defaultChecked
      />
      <MeasuredSwitch
        subject={ctx.subject}
        size="s"
        label="Automatically include updates from every followed collection"
      />
      <MeasuredSwitch
        subject={ctx.subject}
        size="l"
        label="Keep a local copy of attachments for offline reading"
        defaultChecked
      />
      <MeasuredSwitch
        subject={ctx.subject}
        label="Enable_notifications_for_external_collaborators_and_reviewers"
      />
      <MeasuredSwitch subject={ctx.subject} aria-label="Background sync" defaultChecked />
    </Stack>
  );
}

export function Surfaces({ ctx }: PreviewProps): ReactElement {
  return (
    <BinaryPlate surface={ctx.surface}>
      <MeasuredSwitch subject={ctx.subject} label="Email notifications" />
      <MeasuredSwitch subject={ctx.subject} label="Background sync" defaultChecked />
      <MeasuredSwitch
        subject={ctx.subject}
        label="Activity alerts"
        thumbIcon={<BellIcon />}
        defaultChecked
      />
    </BinaryPlate>
  );
}
