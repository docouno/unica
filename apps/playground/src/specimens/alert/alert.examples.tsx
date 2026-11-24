import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Button,
  Code,
  Input,
  Link,
  Stack,
  Text,
  Title,
} from '@docouno/unica';
import type { AlertSize, AlertStatus, GlyphSvgProps } from '@docouno/unica';
import { LightbulbIcon } from '@phosphor-icons/react';
import { useId, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import { ExampleSurface } from '../shared/example-surface.js';
import { focusLinkedFragment, specimenBlockPage } from '../shared/specimen-fragment.js';
import './alert.examples.css';

export function EditorialGlyph(props: GlyphSvgProps): ReactElement {
  return <LightbulbIcon {...props} weight="fill" />;
}

const messages = [
  {
    status: 'neutral',
    title: 'A note before you begin',
    body: 'Changes apply to this workspace only.',
  },
  {
    status: 'info',
    title: 'Maintenance starts tonight',
    body: 'You can keep reading while search is being updated.',
  },
  {
    status: 'success',
    title: 'Your changes are published',
    body: 'Everyone with access can now read the latest revision.',
  },
  {
    status: 'warning',
    title: 'Review before continuing',
    body: 'This procedure has changed since your last review.',
  },
  {
    status: 'danger',
    title: 'We couldn’t save your changes',
    body: 'Your draft is safe. Check your connection and try again.',
  },
] satisfies readonly { status: AlertStatus; title: string; body: string }[];

export function StatusExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      {messages.map(({ status, title, body }) => (
        <Alert {...ctx.subject} role="none" key={status} status={status}>
          <AlertTitle>{title}</AlertTitle>
          <AlertDescription>
            <bdi>{body}</bdi>
          </AlertDescription>
        </Alert>
      ))}
    </Stack>
  );
}

function Sample({
  label,
  children,
}: {
  readonly label: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack gap={8}>
      <Text size="caption-l" color="secondary" weight="medium">
        {label}
      </Text>
      {children}
    </Stack>
  );
}

export function AnatomyExamples({ ctx }: PreviewProps): ReactElement {
  const titleId = useId();
  return (
    <Stack gap={24}>
      <Sample label="Bare text">
        <Alert {...ctx.subject} role="none" size="s">
          All times in your local time zone
        </Alert>
      </Sample>
      <Sample label="Title only">
        <Alert {...ctx.subject} role="none" status="success">
          <AlertTitle>All checks passed</AlertTitle>
        </Alert>
      </Sample>
      <Sample label="Description only">
        <Alert {...ctx.subject} role="none" status="info">
          <AlertDescription>
            <bdi>Only workspace members can open this link.</bdi>
          </AlertDescription>
        </Alert>
      </Sample>
      <Sample label="Editorial icon and rich text">
        <Alert {...ctx.subject} role="none" icon={EditorialGlyph}>
          <AlertTitle>Keep a recovery copy</AlertTitle>
          <AlertDescription>
            <bdi>
              Run <Code>backup --verify</Code> before you begin. Store the output outside the
              cluster.
            </bdi>
          </AlertDescription>
        </Alert>
      </Sample>
      <Sample label="Named page notice">
        <Alert {...ctx.subject} size="l" status="info" role="region" aria-labelledby={titleId}>
          <AlertTitle as="h2" id={titleId}>
            Scheduled maintenance
          </AlertTitle>
          <AlertDescription>
            <bdi>
              Search will be unavailable from 22:00 to 22:15 UTC. Your documents remain available.
            </bdi>
          </AlertDescription>
        </Alert>
      </Sample>
      <Sample label="Dismissible tip">
        <DismissExample ctx={ctx} />
      </Sample>
    </Stack>
  );
}

function DismissExample({
  size = 'm',
  ctx,
}: PreviewProps & { readonly size?: AlertSize }): ReactElement {
  const [open, setOpen] = useState(true);
  const fieldId = useId();
  const alert = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLInputElement>(null);
  const restoreFocus = useRef(false);
  useLayoutEffect(() => {
    const input = field.current;
    if (
      !open &&
      restoreFocus.current &&
      input &&
      input.ownerDocument.activeElement === input.ownerDocument.body
    ) {
      input.focus();
    }
  }, [open]);
  function dismiss(): void {
    restoreFocus.current =
      alert.current?.contains(alert.current.ownerDocument.activeElement) ?? false;
    setOpen(false);
  }
  return (
    <Stack gap={8}>
      {open && (
        <Alert
          {...ctx.subject}
          ref={alert}
          role="none"
          size={size}
          status="info"
          close={<AlertClose aria-label="Dismiss page reference tip" onClose={dismiss} />}
        >
          <AlertTitle>A quicker way to reference a page</AlertTitle>
          <AlertDescription>
            <bdi>Enter the page title or paste a document link.</bdi>
          </AlertDescription>
          <AlertActions>
            <Button size="s" variant="secondary" tone="neutral" onClick={dismiss}>
              Got it
            </Button>
          </AlertActions>
        </Alert>
      )}
      <Text as="label" htmlFor={fieldId} size="body-s" weight="medium">
        Source page
      </Text>
      <Input id={fieldId} ref={field} size="s" width="full" placeholder="Page title or link" />
    </Stack>
  );
}

export function CloseStates({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      {(['s', 'm', 'l'] as const).map((size) => (
        <Sample key={size} label={size.toUpperCase()}>
          <DismissExample ctx={ctx} size={size} />
        </Sample>
      ))}
    </Stack>
  );
}

export function ActionStateExamples({ ctx }: PreviewProps): ReactElement {
  return (
    <Stack gap={24}>
      <Alert {...ctx.subject} role="none" status="warning">
        <AlertTitle>Publication needs an owner</AlertTitle>
        <AlertDescription>
          <bdi>
            Assign an owner in document properties to enable publication. You can continue editing
            your draft.
          </bdi>
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral" disabled>
            Publish document
          </Button>
        </AlertActions>
      </Alert>
      <Alert {...ctx.subject} role="none" status="danger">
        <AlertTitle>Reconnect to publish your draft</AlertTitle>
        <AlertDescription>
          <bdi>Your local changes are safe. Discarding them cannot be undone.</bdi>
        </AlertDescription>
        <AlertActions>
          <Button size="s" variant="secondary" tone="neutral">
            Reconnect
          </Button>
          <Button size="s" variant="ghost" tone="danger">
            Discard draft
          </Button>
        </AlertActions>
      </Alert>
    </Stack>
  );
}

interface RecoveryRequest {
  readonly phase: 'error' | 'pending' | 'success';
  readonly failures: number;
}

export function RecoveryExample({ ctx }: PreviewProps): ReactElement {
  const [{ phase, failures }, setRequest] = useState<RecoveryRequest>({
    phase: 'error',
    failures: 0,
  });
  const [detail, setDetail] = useState(false);
  const detailsId = useId();
  useStoryAction(ctx, (outcome) => {
    if (outcome !== 'failure' && outcome !== 'success') {
      return;
    }
    setRequest((current) => {
      if (current.phase !== 'pending') {
        return current;
      }
      return outcome === 'success'
        ? { ...current, phase: 'success' }
        : { phase: 'error', failures: current.failures + 1 };
    });
  });
  return (
    <Stack gap={12} data-example-disclosure="">
      {phase === 'success' ? (
        <Alert {...ctx.subject} key="success" status="success">
          <AlertTitle>Changes saved</AlertTitle>
          <AlertDescription>
            <bdi>Your draft and the published revision are up to date.</bdi>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert
          {...ctx.subject}
          key="error"
          status="danger"
          role={failures === 0 ? 'none' : 'alert'}
        >
          <AlertTitle>We couldn’t save your changes</AlertTitle>
          <AlertDescription>
            <bdi>
              {failures
                ? `Attempt ${failures} failed. Your draft is safe on this device.`
                : 'Your draft is safe on this device. Reconnect to publish your changes.'}
            </bdi>
          </AlertDescription>
          <AlertActions>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              loading={phase === 'pending'}
              onClick={() => setRequest({ phase: 'pending', failures })}
            >
              Try again
            </Button>
            <Button
              size="s"
              variant="ghost"
              tone="neutral"
              aria-expanded={detail}
              aria-controls={detailsId}
              style={{ minInlineSize: '8.25em' }}
              onClick={() => setDetail(!detail)}
            >
              {detail ? 'Hide details' : 'Show details'}
            </Button>
          </AlertActions>
        </Alert>
      )}
      <Text id={detailsId} hidden={!detail || phase === 'success'} size="body-s" color="secondary">
        <bdi>The server did not respond. No changes were discarded.</bdi>
      </Text>
    </Stack>
  );
}

export function OverflowExamples({ ctx }: PreviewProps): ReactElement {
  const referenceId = `alert-overflow-${ctx.theme.id}-report`;
  const page = specimenBlockPage('alert', 'states', 'overflow', ctx.theme.id);
  return (
    <Stack gap={24} className="alert-demo-narrow">
      <Alert {...ctx.subject} role="none" status="warning" size="s">
        <AlertTitle>Review before replacing the current workspace configuration</AlertTitle>
        <AlertDescription>
          <bdi>
            Your existing access rules and document links will remain available until this change is
            confirmed.
          </bdi>
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
      <Alert {...ctx.subject} role="none" status="danger">
        <AlertTitle>Three items need your attention</AlertTitle>
        <AlertDescription>
          <ul>
            <li>
              <bdi>The document needs an owner.</bdi>
            </li>
            <li>
              <bdi>The revision must have a unique name.</bdi>
            </li>
            <li>
              <bdi>Reconnect the source before importing.</bdi>
            </li>
          </ul>
          <bdi>
            Check the source at{' '}
            <Link tone="inherit" href={`${page}#${referenceId}`}>
              imports/workspace-configuration-validation-report
            </Link>
            .
          </bdi>
        </AlertDescription>
      </Alert>
      <Alert {...ctx.subject} role="none" status="neutral" size="s">
        <AlertDescription>
          <p ref={focusLinkedFragment} id={referenceId} tabIndex={-1}>
            <bdi>
              Reference:{' '}
              <Code>workspace_configuration_validation_2026_11_16_unresolved_reference</Code>
            </bdi>
          </p>
        </AlertDescription>
      </Alert>
      <Alert
        {...ctx.subject}
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
    </Stack>
  );
}

export function OverlayExample({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const [value, setValue] = useState('');
  const [edited, setEdited] = useState(false);
  const field = useRef<HTMLInputElement>(null);
  const assigned = value.trim() !== '';
  return (
    <div style={{ inlineSize: 'min(100%, 32.5rem)' }}>
      <ExampleSurface surface={ctx.surface} gap={16}>
        <Title as="h2" size="heading-s">
          Document properties
        </Title>
        {assigned ? (
          <Alert {...ctx.subject} key="assigned" size="s" status="success">
            <AlertDescription>
              <bdi>Owner assigned. The document is ready to publish.</bdi>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert
            {...ctx.subject}
            key="required"
            role={edited ? undefined : 'none'}
            size="s"
            status="danger"
          >
            <AlertTitle>Choose a document owner</AlertTitle>
            <AlertDescription id={`${id}-error`}>
              <bdi>An owner is required before this document can be published.</bdi>
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
        <Stack gap={4}>
          <Text as="label" htmlFor={id} size="body-s" weight="medium">
            Owner
          </Text>
          <Input
            id={id}
            ref={field}
            value={value}
            width="full"
            required
            status={assigned ? 'neutral' : 'danger'}
            onChange={(event) => {
              setEdited(true);
              setValue(event.target.value);
            }}
            aria-invalid={!assigned}
            aria-describedby={assigned ? undefined : `${id}-error`}
            placeholder="Name or team"
          />
        </Stack>
        <Alert {...ctx.subject} role="none" size="s" status="warning">
          <AlertDescription>
            <bdi>Changing the owner does not change document access.</bdi>
          </AlertDescription>
        </Alert>
        <Alert {...ctx.subject} role="none" size="s" status="neutral">
          <AlertDescription>
            <bdi>Changes apply to this document only.</bdi>
          </AlertDescription>
        </Alert>
      </ExampleSurface>
    </div>
  );
}
