import { useState } from 'react';
import type { ReactElement } from 'react';
import { CheckCircleIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Divider, Icon, Progress, Stack, Text } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import './progress.examples.css';

const PROGRESS_PHASES = [
  'Preparing',
  'Transferring',
  'Paused',
  'Transferred',
  'Verifying',
  'Complete',
  'Interrupted',
] as const;
type Phase = (typeof PROGRESS_PHASES)[number];

function isPhase(value: unknown): value is Phase {
  return typeof value === 'string' && (PROGRESS_PHASES as readonly string[]).includes(value);
}

export function BoundariesExample({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="activity-study">
      <Progress {...ctx.subject} value={0} label="Ready to transfer" />
      <Progress {...ctx.subject} value={1} label="First measured progress" />
      <Progress {...ctx.subject} value={64} label="Transferring archive" />
      <Progress {...ctx.subject} value={99.6} label="Last bytes remaining" />
      <Progress {...ctx.subject} value={100} label="Transfer complete" />
    </div>
  );
}

export function WaitingExample({ ctx }: PreviewProps): ReactElement {
  return (
    <div className="activity-study">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="activity-stack" key={size}>
          <Progress
            {...ctx.subject}
            size={size}
            value={null}
            label={`Preparing archive · ${size.toUpperCase()}`}
          />
          <Progress
            {...ctx.subject}
            size={size}
            value={64}
            label={`Transferring archive · ${size.toUpperCase()}`}
          />
        </div>
      ))}
      <Divider />
      <Progress
        {...ctx.subject}
        value={null}
        label="Static waiting preview"
        className="activity-static"
      />
    </div>
  );
}

export function LabelsExample({ ctx }: PreviewProps): ReactElement {
  const captionGap = ctx.comparing ? 48 : 32;
  return (
    <div className="activity-study" style={ctx.comparing ? { gap: 'var(--space-48)' } : undefined}>
      <Progress
        {...ctx.subject}
        value={42}
        max={80}
        label="Uploading archive"
        valueLabel="42 of 80 MB"
      />
      <Progress
        {...ctx.subject}
        value={64}
        label="A long operation name wraps naturally without pushing the value outside its container"
      />
      <Progress
        {...ctx.subject}
        value={1284}
        max={1528}
        label="Validating records"
        valueLabel="1,284 of 1,528 records checked"
      />
      <Progress {...ctx.subject} value={64} label="Quiet background task" showValue={false} />
      <Stack gap={captionGap}>
        <Text size="caption-l" color="muted">
          Value only · externally named
        </Text>
        <Progress {...ctx.subject} value={64} aria-label="Archive transfer" />
      </Stack>
      <Stack gap={captionGap}>
        <Text size="caption-l" color="muted">
          Track only · no empty header
        </Text>
        <Progress
          {...ctx.subject}
          value={64}
          showValue={false}
          aria-label="Background transfer"
          size="s"
        />
      </Stack>
    </div>
  );
}

export function MotionExample({ ctx }: PreviewProps): ReactElement {
  const [value, setValue] = useState(64);
  const active = ctx.story?.controls.active !== false;

  useStoryAction(ctx, (actionId) => {
    if (actionId === 'reach-100') {
      setValue(100);
    } else if (actionId === 'replay') {
      setValue(64);
    }
  });

  const running = value < 100 && active;
  return (
    <div className="activity-study">
      <Progress
        {...ctx.subject}
        value={value}
        label={
          value === 100
            ? 'All bytes transferred'
            : active
              ? 'Transferring archive'
              : 'Transfer paused'
        }
        active={running}
        paused={value < 100 && !active}
        status={value === 100 || active ? 'accent' : 'neutral'}
      />
      <Progress {...ctx.subject} value={64} label="Saved measurement · no active work" />
    </div>
  );
}

export function PhaseExample({ ctx }: PreviewProps): ReactElement {
  const rawPhase = ctx.story?.controls.phase;
  const phase: Phase = isPhase(rawPhase) ? rawPhase : 'Transferring';
  const rawValue = ctx.story?.controls.value;
  const value = typeof rawValue === 'number' ? rawValue : 64;
  const unknown = phase === 'Preparing' || phase === 'Verifying';
  const full = phase === 'Transferred' || phase === 'Complete';
  const status =
    phase === 'Complete'
      ? 'success'
      : phase === 'Interrupted'
        ? 'danger'
        : phase === 'Paused'
          ? 'neutral'
          : 'accent';
  const copy = {
    Preparing: 'Finding the total size…',
    Transferring: 'Sending the archive.',
    Paused: 'Paused by you. The last measured value stays visible.',
    Transferred: 'All bytes sent. The server has not verified the archive yet.',
    Verifying: 'Verifying the archive. This phase has no measurable total.',
    Complete: 'Archive verified and ready.',
    Interrupted:
      'Connection interrupted. Keep the measured amount; explain the next action outside the bar.',
  }[phase];
  const glyph =
    phase === 'Complete'
      ? CheckCircleIcon
      : phase === 'Interrupted'
        ? WarningCircleIcon
        : phase === 'Paused'
          ? PauseCircleIcon
          : null;
  return (
    <div className="activity-study">
      <div className="activity-stack">
        <Progress
          {...ctx.subject}
          label={phase === 'Verifying' ? 'Verifying archive' : 'Archive transfer'}
          value={unknown ? null : full ? 100 : value}
          status={status}
          active={phase === 'Transferring'}
          paused={phase === 'Paused'}
        />
        <div className="activity-outcome">
          {glyph && (
            <Icon
              usage="slot"
              icon={glyph}
              size="s"
              color={status === 'neutral' ? 'muted' : status}
            />
          )}
          <Text size="caption-l" color="muted">
            <bdi>{copy}</bdi>
          </Text>
        </div>
      </div>
    </div>
  );
}

export function OverlayExample({ ctx }: PreviewProps): ReactElement {
  return (
    <div
      className="activity-study activity-example-panel unica-overlay-surface"
      data-surface="overlay"
    >
      <Progress {...ctx.subject} value={null} label="Preparing archive" />
      <Progress
        {...ctx.subject}
        value={1284}
        max={1528}
        label="Validating archive"
        valueLabel="1,284 of 1,528"
      />
      <Text size="caption-l" color="muted">
        <bdi>Records are checked before they become available.</bdi>
      </Text>
    </div>
  );
}
