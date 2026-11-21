import { Code } from '@docouno/unica';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ArrowClockwiseIcon } from '@phosphor-icons/react';
import { Alert, AlertActions, AlertDescription, AlertTitle } from './alert.proto.js';
import type { AlertSize, AlertStatus } from './alert.proto.js';
import { Button, IconButton } from '../button/button.proto.js';
import { Card } from '../card/card.proto.js';
import { Link } from '../link/link.proto.js';
import { Text } from '@docouno/unica';
import './alert.examples.css';

const statuses: readonly AlertStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const messages: Record<AlertStatus, { title: string; reference: string; description: string }> = {
  neutral: {
    title: 'Changes apply to this workspace',
    reference: 'workspace_id',
    description: 'Check the workspace identifier before making changes.',
  },
  info: {
    title: 'Search maintenance starts tonight',
    reference: 'search_index',
    description: 'Your documents remain available while the index is updated.',
  },
  success: {
    title: 'Your revision is published',
    reference: 'revision_id',
    description: 'The new revision is available to everyone with access.',
  },
  warning: {
    title: 'Review the replication settings',
    reference: 'replication_lag',
    description: 'Confirm the lag threshold before starting the procedure.',
  },
  danger: {
    title: 'We couldn’t publish your draft',
    reference: 'connection_timeout',
    description: 'Your changes are safe. Check the connection before trying again.',
  },
};

export function ContextStatusControl({
  value,
  onChange,
}: {
  readonly value: AlertStatus;
  readonly onChange: (value: AlertStatus) => void;
}): ReactElement {
  return (
    <label className="alert-context-control">
      Message type
      <select value={value} onChange={(event) => onChange(event.target.value as AlertStatus)}>
        {statuses.map((status) => (
          <option key={status} value={status}>
            {status}
          </option>
        ))}
      </select>
    </label>
  );
}

function ContextCase({
  status,
  size = 'm',
}: {
  readonly status: AlertStatus;
  readonly size?: AlertSize;
}): ReactElement {
  const [open, setOpen] = useState(true);
  const [details, setDetails] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const restore = useRef<HTMLButtonElement>(null);
  const id = useId();
  useLayoutEffect(() => {
    if (!open) {
      restore.current?.focus();
    }
  }, [open]);
  if (!open) {
    return (
      <Button ref={restore} size="s" variant="ghost" tone="neutral" onClick={() => setOpen(true)}>
        Restore {status} notice
      </Button>
    );
  }
  return (
    <Alert
      status={status}
      size={size}
      onClose={() => setOpen(false)}
      closeLabel={`Dismiss ${status} color example`}
    >
      <AlertTitle>{messages[status].title}</AlertTitle>
      <AlertDescription>
        {messages[status].description} Reference: <Code>{messages[status].reference}</Code>.{' '}
        <Link href="https://example.com/guidance" tone="inherit">
          Read guidance
        </Link>
        .
        {details && (
          <p id={`${id}-details`}>
            The full reference is <Code>{messages[status].reference}</Code>. This panel stays in the
            same color context.
          </p>
        )}
        {acknowledged && <p>Notice acknowledged for this preview.</p>}
      </AlertDescription>
      <AlertActions>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          aria-expanded={details}
          aria-controls={details ? `${id}-details` : undefined}
          onClick={() => setDetails(!details)}
        >
          {details ? 'Hide details' : 'Show details'}
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={acknowledged}
          onClick={() => setAcknowledged(true)}
        >
          {acknowledged ? 'Acknowledged' : 'Acknowledge'}
        </Button>
      </AlertActions>
    </Alert>
  );
}

export function ContextExamples(): ReactElement {
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Code, the link, close, and ordinary neutral actions follow the painted message. No
        per-status button colors are supplied. Open details, acknowledge, or dismiss each notice.
      </p>
      {statuses.map((status) => (
        <ContextCase key={status} status={status} />
      ))}
    </div>
  );
}

type ContextState =
  | 'rest'
  | 'hover'
  | 'active'
  | 'focus'
  | 'hover-focus'
  | 'active-focus'
  | 'pending'
  | 'disabled'
  | 'open'
  | 'selected';
const states: readonly ContextState[] = [
  'rest',
  'hover',
  'active',
  'focus',
  'hover-focus',
  'active-focus',
  'pending',
  'disabled',
  'open',
  'selected',
];

export function ContextStateExamples(): ReactElement {
  const [status, setStatus] = useState<AlertStatus>('danger');
  const [underline, setUnderline] = useState<'always' | 'hover' | 'none'>('always');
  return (
    <div className="alert-demo-stack">
      <div className="alert-demo-actions">
        <ContextStatusControl value={status} onChange={setStatus} />
        <label className="alert-context-control">
          Link underline
          <select
            value={underline}
            onChange={(event) => setUnderline(event.target.value as 'always' | 'hover' | 'none')}
          >
            <option value="always">Always</option>
            <option value="hover">On hover</option>
            <option value="none">None</option>
          </select>
        </label>
      </div>
      <p className="alert-demo-note">
        Pinned comparisons of the same actions. Use Contextual content or Recovery for working
        commands. Pending keeps the plate, focus, and width; unavailable actions stay in the
        message’s color family. Guidance remains available during a retry or an unavailable action.
        Each focused control is independently pinned for comparison.
      </p>
      <Alert status={status}>
        <AlertTitle>{messages[status].title}</AlertTitle>
        <AlertDescription>
          Reference <Code>{messages[status].reference}</Code> keeps its own tonal step.
        </AlertDescription>
        <div className="alert-context-state-list">
          {states.map((state) => {
            const preview =
              state === 'hover-focus'
                ? 'hover'
                : state === 'active-focus'
                  ? 'active'
                  : state === 'hover' || state === 'active' || state === 'focus'
                    ? state
                    : 'rest';
            return (
              <div key={state} className="alert-context-state-row">
                <span className="alert-context-state-label">
                  {state === 'active'
                    ? 'Pressed'
                    : state === 'hover-focus'
                      ? 'Hover + focus'
                      : state === 'active-focus'
                        ? 'Pressed + focus'
                        : state === 'pending'
                          ? 'Pending + focus'
                          : state}
                </span>
                <div className="alert-demo-actions">
                  {(['secondary', 'ghost'] as const).map((variant) => (
                    <Button
                      key={variant}
                      size="s"
                      variant={variant}
                      tone="neutral"
                      previewState={preview}
                      previewFocus={
                        state === 'pending' || state === 'hover-focus' || state === 'active-focus'
                      }
                      loading={state === 'pending'}
                      disabled={state === 'disabled'}
                      aria-expanded={state === 'open' ? true : undefined}
                      pressed={state === 'selected' ? true : undefined}
                    >
                      {state === 'open'
                        ? variant === 'secondary'
                          ? 'Hide details'
                          : 'Options'
                        : state === 'selected'
                          ? variant === 'secondary'
                            ? 'Pin notice'
                            : 'Mute notice'
                          : variant === 'secondary'
                            ? 'Try again'
                            : 'Details'}
                    </Button>
                  ))}
                  <IconButton
                    size="s"
                    variant="ghost"
                    tone="neutral"
                    icon={ArrowClockwiseIcon}
                    aria-label={`${state} refresh appearance`}
                    previewState={preview}
                    previewFocus={
                      state === 'pending' || state === 'hover-focus' || state === 'active-focus'
                    }
                    loading={state === 'pending'}
                    disabled={state === 'disabled'}
                  />
                  <Link
                    href="https://example.com/guidance"
                    tone="inherit"
                    underline={underline}
                    previewState={preview === 'hover' || preview === 'active' ? preview : 'rest'}
                    previewFocus={
                      state === 'focus' || state === 'hover-focus' || state === 'active-focus'
                    }
                  >
                    Guidance
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </Alert>
    </div>
  );
}

export function ContextBoundaryExamples(): ReactElement {
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Transparent content passes the context through. A painted Card or new overlay supplies its
        own context; the outer notice resumes after it. These are read-only color studies.
      </p>
      <Alert status="danger">
        <AlertTitle>The source is unavailable</AlertTitle>
        <AlertDescription>
          Inherited code: <Code>connection_timeout</Code>.
        </AlertDescription>
        <Text size="body-s" color="secondary">
          A transparent Text changes its text color; <Code>connection_timeout</Code> still reads the
          painted Alert context.
        </Text>
        <Card size="s">
          <p className="alert-demo-heading">A neutral Card starts a new context</p>
          <p className="alert-demo-note">
            Code <Code>source_id</Code> and supporting actions use the Card’s neutral palette.
          </p>
          <div className="alert-demo-actions">
            <Button size="s" variant="secondary" tone="neutral">
              Inspect source
            </Button>
            <Button size="s" variant="ghost" tone="neutral">
              Details
            </Button>
          </div>
        </Card>
        <AlertDescription>
          Back on the outer surface: <Code>connection_timeout</Code>.
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Try again
          </Button>
          <Button size="s" variant="ghost" tone="neutral">
            Keep draft
          </Button>
        </AlertActions>
      </Alert>
      <Alert status="warning">
        <AlertTitle>A floating surface starts a new context</AlertTitle>
        <AlertDescription>
          Outer reference: <Code>owner_id</Code>. The static panel below paints the actual overlay
          material.
        </AlertDescription>
        <div className="alert-demo-overlay" data-surface="overlay">
          <p className="alert-demo-heading">Reference details</p>
          <p className="alert-demo-note">
            Neutral overlay code <Code>owner_id</Code> and actions do not inherit the warning tint.
          </p>
          <div className="alert-demo-actions">
            <Button size="s" variant="secondary" tone="neutral">
              Inspect owner
            </Button>
            <Button size="s" variant="ghost" tone="neutral">
              Close details
            </Button>
          </div>
        </div>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Review owner
          </Button>
        </AlertActions>
      </Alert>
      <Alert status="warning">
        <AlertTitle>Explicit action tones retain their meaning</AlertTitle>
        <AlertDescription>
          The supporting action adapts to this surface. Explicit accent and danger actions keep
          their own palette. An explicit neutral Code keeps its own plate:{' '}
          <Code tone="neutral">draft_id</Code>. These are independent appearance samples.
        </AlertDescription>
        <div className="alert-context-state-list">
          <div className="alert-demo-actions">
            <Button size="s" variant="secondary" tone="neutral">
              Review draft
            </Button>
            <span>
              <Code>neutral</Code>
            </span>
          </div>
          <div className="alert-demo-actions">
            <Button size="s" variant="primary" tone="accent">
              Create a copy
            </Button>
            <span>
              <Code>accent</Code>
            </span>
          </div>
          <div className="alert-demo-actions">
            <Button size="s" variant="primary" tone="danger">
              Discard draft
            </Button>
            <span>
              <Code>danger</Code>
            </span>
          </div>
          <div className="alert-demo-actions">
            <Button size="s" variant="secondary" tone="neutral">
              Inspect <Code plate={false}>draft_id</Code>
            </Button>
          </div>
        </div>
      </Alert>
    </div>
  );
}

export function ContextOverlayExamples(): ReactElement {
  const [status, setStatus] = useState<AlertStatus>('danger');
  return (
    <div className="alert-demo-overlay" data-surface="overlay">
      <p className="alert-demo-heading">Context on floating material</p>
      <ContextStatusControl value={status} onChange={setStatus} />
      <ContextCase key={status} status={status} size="s" />
      <p className="alert-demo-note">
        The panel owns glass and elevation. The notice owns its status ground and the ordinary
        controls placed on it.
      </p>
    </div>
  );
}
