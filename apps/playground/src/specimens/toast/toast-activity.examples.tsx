import {
  Button,
  Card,
  Flex,
  Stack,
  Text,
  ToastProvider,
  ToastViewport,
  useToast,
} from '@docouno/unica';
import type { ToastId, ToastOptions } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import type { PreviewProps } from '../../workbench/types.js';
import { useToastStoryAction } from './use-toast-story-action.js';
import './toast-activity.examples.css';

const phases = {
  loading: {
    title: 'Preparing your export',
    description: 'Collecting page counts for the document report.',
    loading: true,
  },
  success: {
    title: 'Export ready',
    description: 'document-report.csv includes both documents.',
    status: 'success',
  },
  failure: {
    title: 'Export failed',
    description: 'The connection was interrupted. Your report can be retried.',
    status: 'danger',
  },
  retry: {
    title: 'Retrying export',
    description: 'Reconnecting to prepare the document report.',
    status: 'danger',
  },
} as const satisfies Record<string, ToastOptions>;

function Operation({ ctx }: PreviewProps): ReactElement {
  const store = useToast();
  const id = useRef<ToastId | null>(null);
  const seeded = useRef(false);
  const owner = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<keyof typeof phases>('loading');
  const [fileOpen, setFileOpen] = useState(false);
  const fileLabel = fileOpen ? 'Hide file' : 'View file';

  useLayoutEffect(() => {
    if (!seeded.current) {
      seeded.current = true;
      id.current = store.show(phases.loading, { announce: false });
    }
  }, [store]);

  function openFile(): void {
    setFileOpen((open) => !open);
  }

  function retry(fromNotice: boolean): void {
    setPhase('retry');
    const label = 'Retry export';
    const action = { label, pending: true, onClick: () => retry(true) };
    const options = { ...phases.retry, action };
    if (!fromNotice && (id.current === null || !store.update(id.current, options))) {
      id.current = store.show(options);
    } else if (fromNotice && id.current !== null) {
      store.update(id.current, options);
    }
  }

  useToastStoryAction(
    ctx,
    owner,
    (action, announce) => {
      const next = action === 'resolve' ? 'success' : 'failure';
      setPhase(next);
      if (id.current !== null) {
        store.update(
          id.current,
          {
            ...phases[next],
            loading: false,
            action:
              next === 'success'
                ? { label: 'View file', onClick: openFile }
                : { label: 'Retry export', onClick: () => retry(true) },
          },
          { announce },
        );
      }
    },
    (action) =>
      (action === 'resolve' || action === 'reject') && (phase === 'loading' || phase === 'retry'),
  );

  return (
    <Stack
      className="toast-activity"
      ref={owner}
      role="group"
      aria-label="Document export"
      tabIndex={-1}
      gap={12}
    >
      <Card size="s">
        <Stack gap={8} align="start">
          <Text size="body-s" weight="semibold">
            {phases[phase].title}
          </Text>
          <Text size="body-s" color="secondary">
            {phases[phase].description}
          </Text>
          {phase === 'success' && (
            <Button size="s" variant="secondary" tone="neutral" onClick={openFile}>
              {fileLabel}
            </Button>
          )}
          {phase === 'failure' && (
            <Button size="s" variant="secondary" tone="neutral" onClick={() => retry(false)}>
              Retry export
            </Button>
          )}
        </Stack>
      </Card>
      {phase === 'success' && fileOpen && (
        <Card size="s">
          <Text size="body-s" weight="semibold">
            <bdi>document-report.csv</bdi>
          </Text>
          <pre className="toast-activity-file" dir="ltr">
            {'Document,Pages\nProject brief,4\nDesign notes,8'}
          </pre>
        </Card>
      )}
      <ToastViewport {...ctx.subject} fallbackFocusRef={owner} />
    </Stack>
  );
}

function Lifetime({ ctx }: PreviewProps): ReactElement {
  const store = useToast();
  const [version, setVersion] = useState(1);
  const [archived, setArchived] = useState(false);
  const undo = useRef<ToastId | null>(null);
  const archive = useRef<HTMLButtonElement>(null);

  function restore(): void {
    setArchived(false);
    if (undo.current !== null) {
      store.dismiss(undo.current);
      undo.current = null;
    }
  }

  return (
    <Stack className="toast-activity" gap={12}>
      <Card size="s">
        <Stack gap={8} align="start">
          <Text size="body-s" weight="semibold">
            Project brief
          </Text>
          <Text size="body-s" color="secondary">
            {archived ? 'Archived' : 'Documents'} · Version {version}
          </Text>
          <Flex wrap="wrap" gap={8}>
            <Button
              size="s"
              variant="secondary"
              tone="neutral"
              disabled={archived}
              onClick={() => {
                setVersion(version + 1);
                store.show({ title: `Version ${version + 1} saved`, status: 'success' });
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
                  undo.current = store.show({
                    title: 'Document archived',
                    action: { label: 'Undo', onClick: restore },
                  });
                }
              }}
            >
              {archived ? 'Restore document' : 'Archive document'}
            </Button>
          </Flex>
        </Stack>
      </Card>
      <ToastViewport {...ctx.subject} fallbackFocusRef={archive} />
    </Stack>
  );
}

export function ToastOperation({ ctx }: PreviewProps): ReactElement {
  return (
    <OverlayExampleFrame scopePortals ctx={ctx} title="Operation results" height={340}>
      <ToastProvider>
        <Operation ctx={ctx} />
      </ToastProvider>
    </OverlayExampleFrame>
  );
}

export function ToastLifetime({ ctx }: PreviewProps): ReactElement {
  return (
    <OverlayExampleFrame scopePortals ctx={ctx} title="Toast reading time" height={340}>
      <ToastProvider>
        <Lifetime ctx={ctx} />
      </ToastProvider>
    </OverlayExampleFrame>
  );
}
