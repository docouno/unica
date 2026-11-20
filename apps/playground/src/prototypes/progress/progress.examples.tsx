import { useId, useState } from 'react';
import type { ReactElement } from 'react';
import { CheckCircleIcon, PauseCircleIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Icon } from '@docouno/unica';
import { Button } from '../button/button.proto.js';
import { Progress } from './progress.proto.js';
import './progress.examples.css';

const states = [
  'Preparing',
  'Transferring',
  'Paused',
  'Transferred',
  'Verifying',
  'Complete',
  'Interrupted',
] as const;
type Phase = (typeof states)[number];

function PhaseStudy(): ReactElement {
  const id = useId();
  const [phase, setPhase] = useState<Phase>('Transferring');
  const [value, setValue] = useState(64);
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
    Transferring: 'Sending the archive. The slider below supplies sample measurements.',
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
          {glyph && <Icon icon={glyph} size="s" color={status === 'neutral' ? 'muted' : status} />}
          <span>{copy}</span>
        </div>
      </div>
      <div className="activity-preview-controls activity-divider">
        <label htmlFor={`${id}-phase`}>Preview phase</label>
        <select
          id={`${id}-phase`}
          value={phase}
          onChange={(event) => setPhase(event.target.value as Phase)}
        >
          {states.map((state) => (
            <option key={state}>{state}</option>
          ))}
        </select>
        <label htmlFor={`${id}-value`}>Measured amount · {value}%</label>
        <input
          id={`${id}-value`}
          type="range"
          min="0"
          max="100"
          value={value}
          disabled={phase !== 'Transferring'}
          onChange={(event) => setValue(Number(event.target.value))}
        />
      </div>
      <span className="activity-caption">
        Controlled phase study. No network request or simulated rate. Pausing, retrying, and
        announcing outcomes belong to the surrounding task.
      </span>
    </div>
  );
}

function MotionStudy(): ReactElement {
  const [value, setValue] = useState(64);
  const [active, setActive] = useState(true);
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
        active={active}
        paused={!active}
        status={active ? 'accent' : 'neutral'}
      />
      <div className="activity-row">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={value === 100}
          onClick={() => {
            setActive(!active);
          }}
        >
          {active ? 'Pause' : 'Resume'}
        </Button>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            setValue(value === 100 ? 64 : 100);
            setActive(true);
          }}
        >
          {value === 100 ? 'Replay' : 'Reach 100%'}
        </Button>
      </div>
      <Progress value={64} label="Saved measurement · no active work" />
      <span className="activity-caption">
        Frost lets light breathe behind an active measured edge. Pausing quiets the light; reaching
        100% lets it settle. The data never pulses or advances by itself. Soft and Pixel remain
        matte.
      </span>
    </div>
  );
}

const examples: Record<string, () => ReactElement> = {
  scale: () => (
    <div className="activity-study">
      <Progress size="s" value={64} label="Small · compact rows" />
      <Progress size="m" value={64} label="Medium · default" />
      <Progress size="l" value={64} label="Large · prominent task" />
      <span className="activity-caption">
        4 / 8 / 12px. The fill has no inner border; even the smallest bar keeps its full color.
      </span>
    </div>
  ),
  boundaries: () => (
    <div className="activity-study">
      <Progress value={0} label="Ready to transfer" />
      <Progress value={1} label="First measured progress" />
      <Progress value={64} label="Transferring archive" />
      <Progress value={99.6} label="Last bytes remaining" />
      <Progress value={100} label="Transfer complete" />
      <span className="activity-caption">
        99.6% still reads 99%. Reaching 100% does not choose a success color or dismiss the task.
      </span>
    </div>
  ),
  waiting: () => (
    <div className="activity-study">
      {(['s', 'm', 'l'] as const).map((size) => (
        <div className="activity-stack" key={size}>
          <Progress size={size} value={null} label={`Preparing archive · ${size.toUpperCase()}`} />
          <Progress size={size} value={64} label={`Transferring archive · ${size.toUpperCase()}`} />
        </div>
      ))}
      <div className="activity-divider">
        <Progress value={null} label="Static waiting preview" previewStatic />
      </div>
      <span className="activity-caption">
        Preparing and transferring share the same accent paint. The broad candy stripe changes the
        texture, without dimming the operation. Reduced motion stops its travel.
      </span>
    </div>
  ),
  statuses: () => (
    <div className="activity-study">
      <Progress value={64} label="Accent · active transfer" />
      <Progress value={64} status="neutral" label="Neutral · background work" />
      <Progress value={64} status="info" label="Info · synchronizing sources" />
      <Progress value={100} status="success" label="Success · archive verified" />
      <Progress value={64} status="warning" label="Warning · waiting for connection" />
      <Progress value={64} status="danger" label="Danger · transfer interrupted" />
      <span className="activity-caption">
        Status is supplied by the task. A warning or error keeps the last known measurement; color
        never replaces an explanation.
      </span>
    </div>
  ),
  labels: () => (
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
        <span className="activity-caption">Value only · externally named</span>
        <Progress value={64} aria-label="Archive transfer" />
      </div>
      <div className="activity-stack">
        <span className="activity-caption">Track only · no empty header</span>
        <Progress value={64} showValue={false} aria-label="Background transfer" size="s" />
      </div>
    </div>
  ),
  phases: () => <PhaseStudy />,
  motion: () => <MotionStudy />,
  overlay: () => (
    <div className="activity-overlay activity-study">
      <Progress value={null} label="Preparing archive" />
      <Progress value={1284} max={1528} label="Validating archive" valueLabel="1,284 of 1,528" />
      <span className="activity-caption">Records are checked before they become available.</span>
    </div>
  ),
};

export default function Study({ section }: { readonly section: string }): ReactElement | null {
  return examples[section]?.() ?? null;
}
