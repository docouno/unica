import { Code } from '@docouno/unica';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { LightbulbIcon } from '@phosphor-icons/react';
import { Alert, AlertActions, AlertDescription, AlertTitle } from './alert.proto.js';
import type { AlertSize, AlertStatus } from './alert.proto.js';
import { Button } from '../button/button.proto.js';
import { Link } from '../link/link.proto.js';
import './alert.examples.css';

const statuses: readonly AlertStatus[] = ['neutral', 'info', 'success', 'warning', 'danger'];
const sizes: readonly AlertSize[] = ['s', 'm', 'l'];
const copy: Record<AlertStatus, { title: string; body: string }> = {
  neutral: { title: 'A note before you begin', body: 'Changes apply to this workspace only.' },
  info: {
    title: 'Maintenance starts tonight',
    body: 'You can keep reading while search is being updated.',
  },
  success: {
    title: 'Your changes are published',
    body: 'Everyone with access can now read the latest revision.',
  },
  warning: {
    title: 'Review before continuing',
    body: 'This procedure has changed since your last review.',
  },
  danger: {
    title: 'We couldn’t save your changes',
    body: 'Your draft is safe. Check your connection and try again.',
  },
};

export function StatusExamples(): ReactElement {
  return (
    <div className="alert-demo-stack">
      {statuses.map((status) => (
        <Alert key={status} status={status}>
          <AlertTitle>{copy[status].title}</AlertTitle>
          <AlertDescription>{copy[status].body}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
}

export function SizeExamples(): ReactElement {
  return (
    <div className="alert-demo-stack">
      {sizes.map((size) => (
        <div key={size} className="alert-demo-case">
          <p className="alert-demo-label">
            {size.toUpperCase()} ·{' '}
            {size === 's' ? 'Dense sections' : size === 'm' ? 'Forms & sections' : 'Page notices'}
          </p>
          {statuses.map((status) => (
            <Alert key={status} status={status} size={size}>
              {copy[status].title}
            </Alert>
          ))}
        </div>
      ))}
    </div>
  );
}

export function AnatomyExamples(): ReactElement {
  const id = useId();
  return (
    <div className="alert-demo-stack">
      <div className="alert-demo-case">
        <p className="alert-demo-label">Bare text · no icon on neutral</p>
        <Alert size="s">Times are shown in your local timezone.</Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Title only</p>
        <Alert status="success">
          <AlertTitle>All checks passed</AlertTitle>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Description only</p>
        <Alert status="info">
          <AlertDescription>Only workspace members can open this link.</AlertDescription>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Editorial icon · rich text</p>
        <Alert icon={<LightbulbIcon weight="fill" />}>
          <AlertTitle>Keep a recovery copy</AlertTitle>
          <AlertDescription>
            Run <Code>backup --verify</Code> before you begin. Store the output outside the cluster.
          </AlertDescription>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Static, named page notice · L</p>
        <Alert size="l" status="info" role="region" aria-labelledby={`${id}-notice`}>
          <AlertTitle as="h2" id={`${id}-notice`}>
            Scheduled maintenance
          </AlertTitle>
          <AlertDescription>
            Search will be unavailable from 22:00 to 22:15 UTC. Your documents remain available.
          </AlertDescription>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Full anatomy · live dismissal</p>
        <DismissExample />
      </div>
    </div>
  );
}

export function DismissExample(): ReactElement {
  const [open, setOpen] = useState(true);
  const restore = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (!open) {
      restore.current?.focus();
    }
  }, [open]);
  return (
    <div className="alert-demo-case">
      {open && (
        <Alert
          status="info"
          closeLabel="Dismiss keyboard shortcut tip"
          onClose={() => setOpen(false)}
        >
          <AlertTitle>A quicker way to find a page</AlertTitle>
          <AlertDescription>Search by title or paste a document link.</AlertDescription>
          <AlertActions>
            <Button size="s" variant="secondary" tone="neutral" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </AlertActions>
        </Alert>
      )}
      <div className="alert-demo-actions">
        <Button
          ref={restore}
          size="s"
          variant="ghost"
          tone="neutral"
          disabled={open}
          onClick={() => setOpen(true)}
        >
          Show tip again
        </Button>
        <span className="alert-demo-note">
          {open
            ? 'Tab to × or Got it; Escape leaves the message open.'
            : 'Tip dismissed. Focus moves to Show tip again.'}
        </span>
      </div>
    </div>
  );
}

export function CloseStates(): ReactElement {
  const [dismissed, setDismissed] = useState('');
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Close states are pinned for comparison. Each × still dismisses its sample. The surface
        itself never responds to hover or press.
      </p>
      {(['rest', 'hover', 'active', 'focus'] as const).map((state) => (
        <div className="alert-demo-case" key={state}>
          <p className="alert-demo-label">
            {state === 'active' ? 'Pressed' : state === 'focus' ? 'Keyboard focus' : state}
          </p>
          {dismissed === state ? (
            <Button size="s" variant="ghost" tone="neutral" onClick={() => setDismissed('')}>
              Restore {state} sample
            </Button>
          ) : (
            <Alert
              size="s"
              status="warning"
              previewClose={state}
              onClose={() => setDismissed(state)}
              closeLabel={`Dismiss ${state} example`}
            >
              <AlertTitle>Review recommended</AlertTitle>
              <AlertDescription>
                This notice can be dismissed without changing the review status.
              </AlertDescription>
            </Alert>
          )}
        </div>
      ))}
      {sizes.map((size) => (
        <div key={size} className="alert-demo-case">
          <p className="alert-demo-label">{size.toUpperCase()} · pinned focus geometry</p>
          <Alert
            size={size}
            status="neutral"
            previewClose="focus"
            onClose={() => setDismissed(size)}
            closeLabel={`Dismiss ${size} focus sample`}
            hidden={dismissed === size}
          >
            A short note with a close action.
          </Alert>
        </div>
      ))}
    </div>
  );
}

export function ActionStateExamples(): ReactElement {
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Action appearances below are pinned. Use Recovery to try state changes. Only actions change
        appearance; the message stays readable.
      </p>
      <Alert status="warning">
        <AlertTitle>Publication needs an owner</AlertTitle>
        <AlertDescription>
          Assign an owner in document properties to enable publication. You can continue editing
          your draft.
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral" disabled>
            Publish document
          </Button>
        </AlertActions>
      </Alert>
      <Alert status="danger">
        <AlertTitle>Reconnect to publish your draft</AlertTitle>
        <AlertDescription>
          Your local changes are safe. Discarding them cannot be undone.
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral" previewState="hover" previewFocus>
            Reconnect
          </Button>
          <Button size="s" variant="ghost" tone="danger" previewState="active">
            Discard draft
          </Button>
        </AlertActions>
      </Alert>
    </div>
  );
}

export function RecoveryExample(): ReactElement {
  const [phase, setPhase] = useState<'error' | 'pending' | 'success'>('error');
  const [detail, setDetail] = useState(false);
  const result = useRef<HTMLParagraphElement>(null);
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Controlled recovery preview. Try again holds a pending state; choose an explicit result
        below. The message stays readable while its action waits.
      </p>
      {phase === 'success' ? (
        <Alert status="success" role="status">
          <AlertTitle>Changes saved</AlertTitle>
          <AlertDescription>Your draft and the published revision are up to date.</AlertDescription>
        </Alert>
      ) : (
        <Alert status="danger" role="alert">
          <AlertTitle>We couldn’t save your changes</AlertTitle>
          <AlertDescription>
            {phase === 'pending'
              ? 'Trying to reconnect. Keep this page open; your draft is safe.'
              : 'Your draft is safe on this device. Reconnect to publish your changes.'}
            {detail && <p>The server did not respond. No changes were discarded.</p>}
          </AlertDescription>
          <AlertActions>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              loading={phase === 'pending'}
              onClick={() => setPhase('pending')}
            >
              Try again
            </Button>
            <Button
              size="s"
              variant="ghost"
              tone="neutral"
              aria-expanded={detail}
              onClick={() => setDetail(!detail)}
            >
              {detail ? 'Hide details' : 'Show details'}
            </Button>
          </AlertActions>
        </Alert>
      )}
      <div className="alert-demo-actions">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={phase !== 'pending'}
          onClick={() => {
            setPhase('error');
            result.current?.focus();
          }}
        >
          Simulate failure
        </Button>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={phase !== 'pending'}
          onClick={() => {
            setPhase('success');
            result.current?.focus();
          }}
        >
          Simulate success
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={() => setPhase('error')}>
          Reset
        </Button>
      </div>
      <p ref={result} tabIndex={-1} className="alert-demo-note">
        {phase === 'pending'
          ? 'Request pending. Use the result controls.'
          : phase === 'success'
            ? 'Recovery complete. No focus moved into the message.'
            : 'The recovery action is available.'}
      </p>
    </div>
  );
}

export function OverflowExamples(): ReactElement {
  return (
    <div className="alert-demo-stack alert-demo-narrow">
      <p className="alert-demo-note">
        A 360px maximum column. Use 120% Text and RTL in the toolbar; nothing is truncated or
        internally scrolled.
      </p>
      <Alert status="warning" size="s">
        <AlertTitle>Review before replacing the current workspace configuration</AlertTitle>
        <AlertDescription>
          Your existing access rules and document links will remain available until this change is
          confirmed.
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Review configuration
          </Button>
          <Button size="s" variant="ghost" tone="neutral">
            Keep current settings
          </Button>
        </AlertActions>
      </Alert>
      <Alert status="danger">
        <AlertTitle>Three items need your attention</AlertTitle>
        <AlertDescription>
          <ul>
            <li>The document needs an owner.</li>
            <li>The revision must have a unique name.</li>
            <li>Reconnect the source before importing.</li>
          </ul>
          Check the source at{' '}
          <Link
            tone="inherit"
            href="https://example.com/imports/workspace-configuration-validation-report"
          >
            example.com/imports/workspace-configuration-validation-report
          </Link>
          .
        </AlertDescription>
      </Alert>
      <Alert status="neutral" size="s">
        <AlertDescription>
          Reference: <Code>workspace_configuration_validation_2026_11_16_unresolved_reference</Code>
        </AlertDescription>
      </Alert>
      <Alert status="success" size="l" lang="ar" dir="rtl" className="alert-demo-arabic">
        <AlertTitle>تم حفظ التغييرات بنجاح</AlertTitle>
        <AlertDescription>
          يمكن لجميع أعضاء مساحة العمل قراءة الإصدار الجديد الآن. <bdi>release-2026.11</bdi>
        </AlertDescription>
      </Alert>
    </div>
  );
}

export function OverlayExample(): ReactElement {
  const id = useId();
  const [value, setValue] = useState('');
  const field = useRef<HTMLInputElement>(null);
  return (
    <div className="alert-demo-overlay" data-surface="overlay">
      <h3 className="alert-demo-heading">Document properties</h3>
      <p className="alert-demo-note">A floating material sample with a native field stand-in.</p>
      {!value && (
        <Alert size="s" status="danger">
          <AlertTitle>Choose a document owner</AlertTitle>
          <AlertDescription id={`${id}-error`}>
            An owner is required before this document can be published.
          </AlertDescription>
          <AlertActions>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              onClick={() => field.current?.focus()}
            >
              Choose owner
            </Button>
          </AlertActions>
        </Alert>
      )}
      {value && (
        <Alert size="s" status="success">
          Owner assigned. The document is ready to publish.
        </Alert>
      )}
      <label className="alert-demo-input">
        Owner
        <input
          ref={field}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          aria-invalid={!value}
          aria-describedby={!value ? `${id}-error` : undefined}
          placeholder="Name or team"
        />
      </label>
      <Alert size="s" status="warning">
        <AlertDescription>Changing the owner does not change document access.</AlertDescription>
      </Alert>
      <Alert size="s" status="neutral">
        Changes apply to this document only.
      </Alert>
    </div>
  );
}

export {
  ContextExamples,
  ContextStateExamples,
  ContextBoundaryExamples,
  ContextOverlayExamples,
} from './alert.context.examples.js';
