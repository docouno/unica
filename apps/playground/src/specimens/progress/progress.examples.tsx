import { useState } from 'react';
import type { ReactElement } from 'react';
import { CheckCircleIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button, Divider, Icon, Progress, Text } from '@docouno/unica';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewContext } from '../../workbench/types.js';
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

export function BoundariesExample(): ReactElement {
  return (
    <div className="activity-study">
      <Progress value={0} label="Ready to transfer" />
      <Progress value={1} label="First measured progress" />
      <Progress value={64} label="Transferring archive" />
      <Progress value={99.6} label="Last bytes remaining" />
      <Progress value={100} label="Transfer complete" />
    </div>
  );
}

export function WaitingExample(): ReactElement {
  return (
    <div className="activity-study">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="activity-stack" key={size}>
          <Progress size={size} value={null} label={`Preparing archive · ${size.toUpperCase()}`} />
          <Progress size={size} value={64} label={`Transferring archive · ${size.toUpperCase()}`} />
        </div>
      ))}
      <Divider />
      <Progress value={null} label="Static waiting preview" className="activity-static" />
    </div>
  );
}

export function LabelsExample(): ReactElement {
  return (
    <div className="activity-study">
      <Progress value={42} max={80} label="Uploading archive" valueLabel="42 of 80 MB" />
      <Progress
        value={64}
        label="A long operation name wraps naturally without pushing the value outside its container"
      />
      <Progress
        value={1284}
        max={1528}
        label="Validating records"
        valueLabel="1,284 of 1,528 records checked"
      />
      <Progress value={64} label="Quiet background task" showValue={false} />
      <div className="activity-stack">
        <Text size="caption-l" color="muted">
          Value only · externally named
        </Text>
        <Progress value={64} aria-label="Archive transfer" />
      </div>
      <div className="activity-stack">
        <Text size="caption-l" color="muted">
          Track only · no empty header
        </Text>
        <Progress value={64} showValue={false} aria-label="Background transfer" size="s" />
      </div>
    </div>
  );
}

export function MotionExample({
  ctx,
}: {
  readonly ctx?: PreviewContext | undefined;
}): ReactElement {
  const [value, setValue] = useState(64);
  const active = ctx?.story?.controls.active !== false;

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
      <Progress value={64} label="Saved measurement · no active work" />
    </div>
  );
}

export function PhaseExample({ ctx }: { readonly ctx?: PreviewContext | undefined }): ReactElement {
  const rawPhase = ctx?.story?.controls.phase;
  const phase: Phase = isPhase(rawPhase) ? rawPhase : 'Transferring';
  const rawValue = ctx?.story?.controls.value;
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
            {copy}
          </Text>
        </div>
      </div>
    </div>
  );
}

export function OverlayExample(): ReactElement {
  return (
    <div className="activity-overlay activity-study">
      <Progress value={null} label="Preparing archive" />
      <Progress value={1284} max={1528} label="Validating archive" valueLabel="1,284 of 1,528" />
      <Text size="caption-l" color="muted">
        Records are checked before they become available.
      </Text>
    </div>
  );
}

export function TransferRowComposition(): ReactElement {
  const [paused, setPaused] = useState(false);
  return (
    <div className="activity-study">
      <div className="activity-stack">
        <Progress
          label={paused ? 'Upload paused' : 'Uploading archive'}
          value={42}
          max={80}
          valueLabel="42 of 80 MB"
          active={!paused}
          paused={paused}
          status={paused ? 'neutral' : 'accent'}
        />
        <div className="activity-row">
          <Button variant="secondary" size="s" onClick={() => setPaused((value) => !value)}>
            {paused ? 'Resume' : 'Pause'}
          </Button>
          <Button variant="ghost" size="s">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export function InterruptedComposition(): ReactElement {
  const [retrying, setRetrying] = useState(false);
  return (
    <div className="activity-study">
      <div className="activity-stack">
        <Progress
          label={retrying ? 'Reconnecting transfer' : 'Archive transfer'}
          value={retrying ? null : 64}
          status={retrying ? 'accent' : 'danger'}
          active={retrying}
        />
        <div className="activity-outcome">
          {!retrying && <Icon usage="slot" icon={WarningCircleIcon} size="s" color="danger" />}
          <Text size="caption-l" color="muted">
            {retrying
              ? 'Resuming from the last confirmed chunk…'
              : 'Connection interrupted at 64%. Retry resumes without losing uploaded bytes.'}
          </Text>
        </div>
        <div className="activity-row">
          <Button variant="secondary" size="s" loading={retrying} onClick={() => setRetrying(true)}>
            Retry transfer
          </Button>
          <Button variant="ghost" size="s" onClick={() => setRetrying(false)}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
