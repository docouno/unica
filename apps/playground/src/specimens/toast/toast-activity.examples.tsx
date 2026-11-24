import { Button, Card, Flex, Stack, Text, VisuallyHidden } from '@docouno/unica';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { ToastCard } from '../../prototypes/toast/toast.proto.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import '../shared/example-surface.css';
import './toast-activity.examples.css';

const exportPhases = {
  loading: {
    title: 'Preparing your export',
    detail: 'Collecting page counts for the document report.',
    status: 'neutral',
  },
  success: {
    title: 'Export ready',
    detail: 'document-report.csv includes both documents.',
    status: 'success',
  },
  failure: {
    title: 'Export failed',
    detail: 'The connection was interrupted. Your documents are unchanged.',
    status: 'danger',
  },
  retry: {
    title: 'Retrying export',
    detail: 'Reconnecting to prepare the document report.',
    status: 'danger',
  },
} as const;

export function ToastOperation({ ctx }: PreviewProps): ReactElement {
  const [{ phase, announce }, setOperation] = useState<{
    phase: keyof typeof exportPhases;
    announce: boolean;
  }>({ phase: 'loading', announce: false });
  const [visible, setVisible] = useState(true);
  const [fileOpen, setFileOpen] = useState(false);
  const owner = useRef<HTMLDivElement>(null);
  const { title, detail, status } = exportPhases[phase];
  const fileAction = {
    label: fileOpen ? 'Hide file' : 'View file',
    onClick: () => setFileOpen((open) => !open),
  };
  useStoryAction(ctx, (action) => {
    if (action === 'resolve' || action === 'reject') {
      setOperation((current) => {
        if (current.phase !== 'loading' && current.phase !== 'retry') {
          return current;
        }
        return {
          phase: action === 'resolve' ? 'success' : 'failure',
          announce: current.phase === 'retry' || !ctx.comparing,
        };
      });
    }
  });

  function retry(): void {
    setOperation({ phase: 'retry', announce: true });
  }

  function keepFocus(): void {
    if (owner.current?.contains(document.activeElement)) {
      owner.current.focus({ preventScroll: true });
    }
  }

  return (
    <Stack
      ref={owner}
      data-example-disclosure=""
      className="toast-activity"
      role="group"
      aria-label="Document export"
      tabIndex={-1}
      gap={12}
    >
      {visible ? (
        <ToastCard
          {...ctx.subject}
          title={title}
          status={status}
          loading={phase === 'loading'}
          onDismiss={() => {
            keepFocus();
            setVisible(false);
          }}
          action={
            phase === 'success'
              ? fileAction
              : phase === 'failure' || phase === 'retry'
                ? {
                    label: 'Retry export',
                    pending: phase === 'retry',
                    onClick: retry,
                  }
                : undefined
          }
        >
          <bdi>{detail}</bdi>
        </ToastCard>
      ) : (
        <Card size="s" data-surface="base">
          <Stack gap={8} align="start">
            <Text size="body-s" weight="semibold">
              <bdi>{title}</bdi>
            </Text>
            <Text size="body-s" color="secondary">
              <bdi>Notification dismissed.</bdi>
            </Text>
            {phase === 'success' && (
              <Button size="s" variant="secondary" tone="neutral" onClick={fileAction.onClick}>
                {fileAction.label}
              </Button>
            )}
            {phase === 'failure' && (
              <Button
                size="s"
                variant="secondary"
                tone="neutral"
                onClick={() => {
                  keepFocus();
                  retry();
                  setVisible(true);
                }}
              >
                Retry export
              </Button>
            )}
          </Stack>
        </Card>
      )}
      {phase === 'success' && fileOpen && (
        <Card size="s" data-surface="base">
          <Text size="body-s" weight="semibold">
            <bdi>document-report.csv</bdi>
          </Text>
          <pre className="toast-activity-file" dir="ltr">
            {'Document,Pages\nProject brief,4\nDesign notes,8'}
          </pre>
        </Card>
      )}
      <VisuallyHidden role="status">{announce ? title : ''}</VisuallyHidden>
    </Stack>
  );
}

function useInactiveWindow(): boolean {
  const [hidden, setHidden] = useState(() => document.hidden);
  const [focused, setFocused] = useState(() => document.hasFocus());
  useEffect(() => {
    const visibility = (): void => setHidden(document.hidden);
    const focus = (): void => setFocused(true);
    const blur = (): void => setFocused(false);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      window.removeEventListener('focus', focus);
      window.removeEventListener('blur', blur);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  return hidden || !focused;
}

function Confirmation({
  ctx,
  version,
  pauses,
  expire,
  dismiss,
}: PreviewProps & {
  readonly version: number;
  readonly pauses: string;
  readonly expire: () => void;
  readonly dismiss: () => void;
}): ReactElement {
  const remaining = useRef(6000);
  const [seconds, setSeconds] = useState(6);
  const paused = Boolean(pauses);
  useLayoutEffect(() => {
    if (paused) {
      return;
    }
    const deadline = performance.now() + remaining.current;
    let timer: number;
    const tick = (): void => {
      const left = deadline - performance.now();
      if (left <= 0) {
        expire();
        return;
      }
      const next = Math.ceil(left / 1000);
      setSeconds(next);
      timer = window.setTimeout(tick, left - (next - 1) * 1000);
    };
    tick();
    return () => {
      window.clearTimeout(timer);
      remaining.current = Math.max(0, deadline - performance.now());
    };
  }, [expire, paused]);

  return (
    <Stack gap={4}>
      <ToastCard
        {...ctx.subject}
        status="success"
        title={`Version ${version} saved`}
        onDismiss={dismiss}
      />
      <Text
        className="toast-activity-clock"
        size="caption-l"
        role="timer"
        aria-label="Confirmation reading time"
      >
        <bdi>
          {seconds} s left{paused ? ` · paused (${pauses})` : ''}
        </bdi>
      </Text>
    </Stack>
  );
}

export function ToastLifetime({ ctx }: PreviewProps): ReactElement {
  const [version, setVersion] = useState(1);
  const [confirmation, setConfirmation] = useState(false);
  const [archived, setArchived] = useState(false);
  const [undo, setUndo] = useState(false);
  const [message, setMessage] = useState('');
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const inactive = useInactiveWindow();
  const save = useRef<HTMLButtonElement>(null);
  const archive = useRef<HTMLButtonElement>(null);
  const region = useRef<HTMLDivElement>(null);
  const pauses = [
    hovered && 'pointer',
    focused && 'focus',
    inactive && 'window',
    ctx.story?.controls.paused === true && 'preview',
  ]
    .filter(Boolean)
    .join(', ');

  const expire = useCallback(() => setConfirmation(false), []);

  function focusOrigin(button: HTMLButtonElement | null): void {
    if (region.current?.contains(document.activeElement)) {
      button?.focus({ preventScroll: true });
    }
  }

  function restore(): void {
    focusOrigin(archive.current);
    setArchived(false);
    setUndo(false);
    setMessage('Project brief restored.');
  }

  return (
    <Stack data-example-disclosure="" className="toast-activity" gap={12}>
      <Card size="s" data-surface="base">
        <Text size="body-s" weight="semibold">
          <bdi>Project brief</bdi>
        </Text>
        <Text size="body-s" color="secondary">
          <bdi>
            {archived ? 'Archived' : 'Documents'} · Version {version}
          </bdi>
        </Text>
        <Flex wrap="wrap" gap={8}>
          <Button
            ref={save}
            size="s"
            variant="secondary"
            tone="neutral"
            disabled={archived}
            onClick={() => {
              setVersion(version + 1);
              setConfirmation(true);
              setMessage(`Version ${version + 1} saved.`);
            }}
          >
            Save version
          </Button>
          <Button
            ref={archive}
            size="s"
            variant="secondary"
            tone="neutral"
            onClick={() => {
              if (archived) {
                restore();
              } else {
                setArchived(true);
                setUndo(true);
                setMessage('Project brief archived. Undo available.');
              }
            }}
          >
            {archived ? 'Restore document' : 'Archive document'}
          </Button>
        </Flex>
      </Card>
      <Stack
        ref={region}
        gap={8}
        onPointerEnter={(event) => setHovered(event.pointerType !== 'touch')}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
      >
        {confirmation && (
          <Confirmation
            key={version}
            ctx={ctx}
            version={version}
            pauses={pauses}
            expire={expire}
            dismiss={() => {
              focusOrigin(archived ? archive.current : save.current);
              setConfirmation(false);
            }}
          />
        )}
        {undo && (
          <ToastCard
            {...ctx.subject}
            title="Document archived"
            action={{ label: 'Undo', onClick: restore }}
            onDismiss={() => {
              focusOrigin(archive.current);
              setUndo(false);
            }}
          />
        )}
      </Stack>
      <VisuallyHidden role="status">{message}</VisuallyHidden>
    </Stack>
  );
}
