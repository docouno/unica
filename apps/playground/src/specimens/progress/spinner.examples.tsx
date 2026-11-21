import { useEffect, useState } from 'react';
import type { ReactElement } from 'react';
import { CheckIcon, WarningCircleIcon } from '@phosphor-icons/react';
import { Button } from '../../prototypes/button/button.proto.js';
import { Icon, Spinner } from '@docouno/unica';
import './progress.examples.css';

function SpinnerLifecycle(): ReactElement {
  const [request, setRequest] = useState<{ duration: number; id: number; fail: boolean } | null>(
    null,
  );
  const [outcome, setOutcome] = useState<'ready' | 'saved' | 'failed'>('ready');
  useEffect(() => {
    if (!request) {
      return;
    }
    const timer = window.setTimeout(() => {
      setRequest(null);
      setOutcome(request.fail ? 'failed' : 'saved');
    }, request.duration);
    return () => window.clearTimeout(timer);
  }, [request]);
  const run = (duration: number, fail = false): void => {
    setOutcome('ready');
    setRequest({ duration, id: Date.now(), fail });
  };
  return (
    <div className="activity-study">
      <div className="activity-waiting-line" aria-busy={Boolean(request)}>
        <span className="activity-reserved">
          {request && <Spinner key={request.id} size="m" tone="muted" delay={150} />}
          {outcome === 'saved' && <Icon usage="slot" icon={CheckIcon} size="m" color="muted" />}
          {outcome === 'failed' && (
            <Icon usage="slot" icon={WarningCircleIcon} size="m" color="danger" />
          )}
        </span>
        <span>
          {request
            ? 'Saving changes…'
            : outcome === 'saved'
              ? 'Changes saved'
              : outcome === 'failed'
                ? 'Could not save changes. Try again.'
                : 'Ready to save'}
        </span>
      </div>
      <div className="activity-row">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={Boolean(request)}
          onClick={() => run(2200)}
        >
          Save · 2.2s
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={Boolean(request)}
          onClick={() => run(80)}
        >
          Quick save · 80ms
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={Boolean(request)}
          onClick={() => run(1400, true)}
        >
          Try failure
        </Button>
      </div>
      <span className="activity-caption">
        Local timing demo. A 150ms reveal delay avoids a flash; the icon slot stays reserved. Text
        responds immediately.
      </span>
    </div>
  );
}

const examples: Record<string, () => ReactElement> = {
  scale: () => (
    <div className="activity-study">
      <div className="activity-row">
        {(['s', 'm', 'l'] as const).map((size) => (
          <div className="activity-sample" key={size}>
            <Spinner size={size} tone="neutral" aria-label={`Loading, size ${size}`} />
            <span className="activity-caption">
              {size.toUpperCase()} · {size === 's' ? 14 : size === 'm' ? 16 : 20}px
            </span>
          </div>
        ))}
      </div>
      <div className="activity-stack activity-divider">
        <span>
          <Spinner /> Loading preview…
        </span>
        <span className="activity-body-large">
          <Spinner /> Preparing your workspace…
        </span>
        <span className="activity-caption">
          Inherit · 1em, following the surrounding text size.
        </span>
      </div>
    </div>
  ),
  tones: () => (
    <div className="activity-study">
      <div className="activity-label">
        <Spinner size="m" tone="neutral" />
        <span>Neutral · primary activity</span>
      </div>
      <div className="activity-label activity-muted">
        <Spinner size="m" tone="muted" />
        <span>Muted · background refresh</span>
      </div>
      <div className="activity-label">
        <Spinner size="m" tone="accent" />
        <span>Accent · the main pending task</span>
      </div>
      <div className="activity-label activity-accent">
        <Spinner size="m" />
        <span>Inherit · follows its text</span>
      </div>
    </div>
  ),
  motion: () => (
    <div className="activity-study">
      <div className="activity-label">
        <Spinner size="m" tone="muted" />
        <span>Loading preview…</span>
      </div>
      <div className="activity-label">
        <Spinner size="m" tone="muted" className="activity-static" />
        <span>
          Loading preview… <span className="activity-caption">· static preview</span>
        </span>
      </div>
      <span className="activity-caption">
        Soft and Frost gather and release the arc. Pixel advances a short trail through eight square
        cells. Reduced motion keeps a readable still frame and the operation label visible.
        Snapshots pin the same still frame.
      </span>
    </div>
  ),
  lifecycle: () => <SpinnerLifecycle />,
  placement: () => (
    <div className="activity-study">
      <div className="activity-label activity-muted" data-glyph-size="s">
        <Spinner size="s" />
        <span>Checking whether this workspace address is available…</span>
      </div>
      <div className="activity-control-slot">
        <span>workspace.example</span>
        <Spinner size="m" />
      </div>
      <span className="activity-caption">
        Static field-slot study. Spinner is passive; typing, validation, and availability belong to
        the field.
      </span>
    </div>
  ),
  overlay: () => (
    <div className="activity-overlay activity-study">
      <div className="activity-label">
        <Spinner size="m" tone="muted" />
        <span>Looking for matching documents…</span>
      </div>
      <span className="activity-caption">A local wait leaves the rest of the page available.</span>
    </div>
  ),
};

export default function Study({ section }: { readonly section: string }): ReactElement | null {
  return examples[section]?.() ?? null;
}
