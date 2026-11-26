import { ToastProvider, ToastViewport, Text, useToast } from '@docouno/unica';
import type { ToastOptions, ToastPlacement } from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import type { PreviewProps } from '../../workbench/types.js';
import { useToastStoryAction } from './use-toast-story-action.js';
import './toast-queue.examples.css';

interface QueueItem extends ToastOptions {
  readonly command?: 'restore' | 'retry';
}

const initialItems: readonly QueueItem[] = [
  { title: 'Workspace is up to date', status: 'info' },
  {
    title: 'Activity report ready',
    status: 'success',
    description: 'The report includes all 12 entries.',
  },
  {
    title: 'Draft backup failed',
    status: 'danger',
    description: 'Your draft is still available. Retry its local backup.',
    command: 'retry',
  },
  { title: 'Document archived', command: 'restore' },
];

const readingItems: readonly QueueItem[] = [
  { title: 'Review complete', status: 'success' },
  { title: 'Comments marked as read' },
  { title: 'Preferences synced', status: 'info' },
  {
    title: 'A link was shared with you',
    status: 'info',
    description: 'The project brief is available in your workspace.',
  },
  {
    title: '2 files were skipped',
    status: 'warning',
    description: 'The other 18 files were imported.',
  },
  {
    title: 'Invitation sent',
    status: 'success',
    description: 'Your teammate can join from the link in their email.',
  },
  ...initialItems,
];

function Queue({
  ctx,
  reading,
  ready,
}: PreviewProps & { readonly reading: boolean; readonly ready: () => void }): ReactElement {
  const toast = useToast();
  const seeded = useRef(false);
  const inspected = useRef(false);
  const number = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const [carrier, setCarrier] = useState<HTMLDivElement | null>(null);
  const placement = (ctx.story?.controls.placement ?? 'bottom-end') as ToastPlacement;

  useLayoutEffect(() => {
    if (seeded.current) {
      return;
    }
    seeded.current = true;
    for (const { command, ...item } of reading ? readingItems : initialItems) {
      const restore = command === 'restore';
      const id = toast.show(
        {
          ...item,
          persistent: true,
          action: command
            ? {
                label: restore ? 'Undo' : 'Retry',
                onClick: () => {
                  if (id !== null) {
                    toast.update(id, {
                      status: 'success',
                      title: restore ? 'Document restored' : 'Draft backup complete',
                      description: restore ? 'Returned to the Documents folder.' : undefined,
                      action: undefined,
                    });
                  }
                },
              }
            : undefined,
        },
        { announce: false },
      );
    }
  }, [reading, toast]);

  useLayoutEffect(() => {
    const view = carrier?.ownerDocument.defaultView;
    if (!carrier || !view || inspected.current) {
      return;
    }
    let frame = 0;
    const capturing =
      view.frameElement?.ownerDocument.documentElement.querySelector('[data-wb-capture-route]') !==
      null;
    function inspect(): void {
      if (!carrier || !view) {
        return;
      }
      if (reading) {
        carrier.querySelector<HTMLButtonElement>('[aria-expanded="false"]')?.click();
        const list = carrier.querySelector<HTMLElement>('[role="group"][tabindex="0"]');
        const max = list ? list.scrollHeight - list.clientHeight : 0;
        if (!list || max <= 1) {
          frame = view.requestAnimationFrame(inspect);
          return;
        }
        if (capturing && (list.scrollTop <= 0 || list.scrollTop >= max)) {
          list.scrollTop = Math.round(max / 2);
          frame = view.requestAnimationFrame(inspect);
          return;
        }
      }
      inspected.current = true;
      ready();
    }
    frame = view.requestAnimationFrame(inspect);
    return () => view.cancelAnimationFrame(frame);
  }, [carrier, reading, ready]);

  useToastStoryAction(ctx, stage, (action, announce) => {
    if (action === 'add') {
      toast.show(
        {
          title: `Backup ${++number.current} complete`,
          status: 'success',
          persistent: true,
        },
        { announce },
      );
    }
  });

  return (
    <div
      className="toast-queue-study"
      data-queue-stage=""
      ref={stage}
      tabIndex={-1}
      role="group"
      aria-label="Document activity"
    >
      <ToastViewport
        {...ctx.subject}
        ref={setCarrier}
        placement={placement}
        fallbackFocusRef={stage}
      />
      {!carrier && (
        <Text className="toast-queue-empty" size="body-s">
          No notifications
        </Text>
      )}
    </div>
  );
}

function QueueStudy({ ctx, reading }: PreviewProps & { readonly reading: boolean }): ReactElement {
  const [ready, setReady] = useState(false);
  return (
    <div className="toast-queue-frame" data-wb-pending={ready ? undefined : ''}>
      <OverlayExampleFrame
        scopePortals
        ctx={ctx}
        title={reading ? 'Reading notifications' : 'Notification queue'}
        height={reading ? 528 : 360}
      >
        <ToastProvider>
          <Queue ctx={ctx} reading={reading} ready={() => setReady(true)} />
        </ToastProvider>
      </OverlayExampleFrame>
    </div>
  );
}

export function ToastStack({ ctx }: PreviewProps): ReactElement {
  return <QueueStudy ctx={ctx} reading={false} />;
}

export function ToastReading({ ctx }: PreviewProps): ReactElement {
  return <QueueStudy ctx={ctx} reading />;
}
