import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Code,
  Link,
} from '@docouno/unica';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { LightbulbIcon } from '@phosphor-icons/react';
import type { AlertSize, AlertStatus, GlyphSvgProps } from '@docouno/unica';
import { Button } from '../../prototypes/button/button.proto.js';
import './alert.examples.css';

export function EditorialGlyph(props: GlyphSvgProps): ReactElement {
  return <LightbulbIcon {...props} weight="fill" />;
}

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
        <Alert role="none" key={status} status={status}>
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
            <Alert role="none" key={status} status={status} size={size}>
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
        <Alert role="none" size="s">
          Times are shown in your local timezone.
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Title only</p>
        <Alert role="none" status="success">
          <AlertTitle>All checks passed</AlertTitle>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Description only</p>
        <Alert role="none" status="info">
          <AlertDescription>Only workspace members can open this link.</AlertDescription>
        </Alert>
      </div>
      <div className="alert-demo-case">
        <p className="alert-demo-label">Editorial icon · rich text</p>
        <Alert role="none" icon={EditorialGlyph}>
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

export function DismissExample({ size = 'm' }: { readonly size?: AlertSize }): ReactElement {
  const [open, setOpen] = useState(true);
  const alert = useRef<HTMLDivElement>(null);
  const restore = useRef<HTMLButtonElement>(null);
  const hadFocus = useRef(false);
  useLayoutEffect(() => {
    const button = restore.current;
    if (
      !open &&
      hadFocus.current &&
      button &&
      button.ownerDocument.activeElement === button.ownerDocument.body
    ) {
      button.focus();
    }
  }, [open]);
  function dismiss(): void {
    hadFocus.current = alert.current?.contains(alert.current.ownerDocument.activeElement) ?? false;
    setOpen(false);
  }
  return (
    <div className="alert-demo-case">
      {open && (
        <Alert
          ref={alert}
          role="none"
          size={size}
          status="info"
          close={<AlertClose aria-label="Dismiss keyboard shortcut tip" onClose={dismiss} />}
        >
          <AlertTitle>A quicker way to find a page</AlertTitle>
          <AlertDescription>Search by title or paste a document link.</AlertDescription>
          <AlertActions>
            <Button size="s" variant="secondary" tone="neutral" onClick={dismiss}>
              Got it
            </Button>
          </AlertActions>
        </Alert>
      )}
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
    </div>
  );
}

export function CloseStates(): ReactElement {
  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Hover or hold × to inspect pointer states. Tab to × for its focus ring. Enter, Space or a
        click dismiss the notice. Escape leaves it open.
      </p>
      {sizes.map((size) => (
        <div key={size} className="alert-demo-case">
          <p className="alert-demo-label">{size.toUpperCase()}</p>
          <DismissExample size={size} />
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
      <Alert role="none" status="warning">
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
      <Alert role="none" status="danger">
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
  const [failures, setFailures] = useState(0);
  const [detail, setDetail] = useState(false);
  const detailsId = useId();
  const result = useRef<HTMLParagraphElement>(null);

  return (
    <div className="alert-demo-stack">
      <p className="alert-demo-note">
        Try again starts a simulated request. Choose the result when it is pending.
      </p>
      {phase === 'success' ? (
        <Alert key="success" status="success">
          <AlertTitle>Changes saved</AlertTitle>
          <AlertDescription>Your draft and the published revision are up to date.</AlertDescription>
        </Alert>
      ) : (
        <Alert key="error" status="danger" role={failures === 0 ? 'none' : 'alert'}>
          <AlertTitle>We couldn’t save your changes</AlertTitle>
          <AlertDescription>
            {failures
              ? `Attempt ${failures} failed. Your draft is safe on this device.`
              : 'Your draft is safe on this device. Reconnect to publish your changes.'}
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
              aria-controls={detailsId}
              onClick={() => setDetail(!detail)}
            >
              {detail ? 'Hide details' : 'Show details'}
            </Button>
          </AlertActions>
        </Alert>
      )}
      <p id={detailsId} hidden={!detail || phase === 'success'} className="alert-demo-note">
        The server did not respond. No changes were discarded.
      </p>
      <div className="alert-demo-actions">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={phase !== 'pending'}
          onClick={({ currentTarget }) => {
            if (currentTarget === currentTarget.ownerDocument.activeElement) {
              result.current?.focus();
            }
            setFailures(failures + 1);
            setPhase('error');
          }}
        >
          Simulate failure
        </Button>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          disabled={phase !== 'pending'}
          onClick={({ currentTarget }) => {
            if (currentTarget === currentTarget.ownerDocument.activeElement) {
              result.current?.focus();
            }
            setPhase('success');
          }}
        >
          Simulate success
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          onClick={() => {
            setFailures(0);
            setDetail(false);
            setPhase('error');
          }}
        >
          Reset
        </Button>
      </div>
      <p ref={result} tabIndex={-1} className="alert-demo-note">
        {phase === 'pending'
          ? 'Request pending. Use the result controls.'
          : phase === 'success'
            ? 'Recovery complete.'
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
      <Alert role="none" status="warning" size="s">
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
      <Alert role="none" status="danger">
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
      <Alert role="none" status="neutral" size="s">
        <AlertDescription>
          Reference: <Code>workspace_configuration_validation_2026_11_16_unresolved_reference</Code>
        </AlertDescription>
      </Alert>
      <Alert
        role="none"
        status="success"
        size="l"
        lang="ar"
        dir="rtl"
        className="alert-demo-arabic"
      >
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
  const [edited, setEdited] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  return (
    <div className="alert-demo-overlay" data-surface="overlay">
      <h3 className="alert-demo-heading">Document properties</h3>
      <p className="alert-demo-note">A floating material sample with a native field stand-in.</p>
      {!value && (
        <Alert key="required" role={edited ? undefined : 'none'} size="s" status="danger">
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
        <Alert key="assigned" size="s" status="success">
          Owner assigned. The document is ready to publish.
        </Alert>
      )}
      <label className="alert-demo-input">
        Owner
        <input
          ref={field}
          value={value}
          onChange={(event) => {
            setEdited(true);
            setValue(event.target.value);
          }}
          aria-invalid={!value}
          aria-describedby={!value ? `${id}-error` : undefined}
          placeholder="Name or team"
        />
      </label>
      <Alert role="none" size="s" status="warning">
        <AlertDescription>Changing the owner does not change document access.</AlertDescription>
      </Alert>
      <Alert role="none" size="s" status="neutral">
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
