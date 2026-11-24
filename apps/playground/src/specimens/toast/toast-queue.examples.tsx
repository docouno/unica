import { useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Text, VisuallyHidden } from '@docouno/unica';
import { ToastViewport } from '../../prototypes/toast/toast.proto.js';
import type { ToastItem, ToastPlacement } from '../../prototypes/toast/toast.proto.js';
import { useStoryAction } from '../../workbench/storyFrameState.js';
import type { PreviewProps } from '../../workbench/types.js';
import './toast-queue.examples.css';

interface QueueItem extends ToastItem {
  readonly command?: 'restore' | 'retry';
}

const initialItems: readonly QueueItem[] = [
  { id: 'sync', title: 'Workspace is up to date', status: 'info' },
  {
    id: 'report',
    title: 'Activity report ready',
    status: 'success',
    children: 'The report includes all 12 entries.',
  },
  {
    id: 'backup',
    title: 'Draft backup failed',
    status: 'danger',
    children: 'Your draft is still available. Retry its local backup.',
    command: 'retry',
  },
  { id: 'archive', title: 'Document archived', command: 'restore' },
];

const readingItems: readonly QueueItem[] = [
  { id: 'review', title: 'Review complete', status: 'success' },
  { id: 'comments', title: 'Comments marked as read' },
  { id: 'preferences', title: 'Preferences synced', status: 'info' },
  {
    id: 'shared',
    title: 'A link was shared with you',
    status: 'info',
    children: 'The project brief is available in your workspace.',
  },
  {
    id: 'import',
    title: '2 files were skipped',
    status: 'warning',
    children: 'The other 18 files were imported.',
  },
  {
    id: 'invite',
    title: 'Invitation sent',
    status: 'success',
    children: 'Your teammate can join from the link in their email.',
  },
  ...initialItems,
];

function Queue({
  ctx,
  reading = false,
}: PreviewProps & { readonly reading?: boolean }): ReactElement {
  const [queue, setQueue] = useState(reading ? readingItems : initialItems);
  const [announcement, setAnnouncement] = useState({ sequence: 0, text: '' });
  const number = useRef(0);
  const stage = useRef<HTMLDivElement>(null);
  const hasNotifications = queue.length > 0;
  const placement = (ctx.story?.controls.placement ?? 'bottom-end') as ToastPlacement;
  const announce = (text: string): void => {
    setAnnouncement((previous) => ({ sequence: previous.sequence + 1, text }));
  };

  useStoryAction(ctx, (action) => {
    if (action !== 'add') {
      return;
    }
    const next = ++number.current;
    setQueue((current) => [
      ...current,
      { id: `backup-${next}`, title: `Backup ${next} complete`, status: 'success' },
    ]);
  });

  const items = queue.map(({ command, ...item }): ToastItem => {
    const card = { ...item, 'data-queue-item': item.id };
    if (!command) {
      return card;
    }
    const restore = command === 'restore';
    return {
      ...card,
      action: {
        label: restore ? 'Undo' : 'Retry',
        onClick: () => {
          const owner = document.activeElement?.closest<HTMLElement>('[data-queue-item]');
          if (owner?.dataset.queueItem === item.id && stage.current?.contains(owner)) {
            owner
              .querySelector<HTMLButtonElement>('.toast-dismiss')
              ?.focus({ preventScroll: true });
          }
          const result: ToastItem = {
            id: item.id,
            status: 'success',
            title: restore ? 'Document restored' : 'Draft backup complete',
            children: restore ? 'Returned to the Documents folder.' : undefined,
          };
          setQueue((current) => current.map((entry) => (entry.id === item.id ? result : entry)));
          announce(result.title);
        },
      },
    };
  });

  const focusStage = (): void => {
    if (stage.current?.contains(document.activeElement)) {
      stage.current.focus({ preventScroll: true });
    }
  };

  return (
    <div
      className="toast-queue-study"
      data-queue-stage=""
      data-reading={reading || undefined}
      ref={stage}
      tabIndex={-1}
      role="group"
      aria-label="Document activity"
    >
      <ToastViewport
        {...ctx.subject}
        items={items}
        placement={placement}
        initialExpanded={reading}
        onDismiss={(id) => {
          if (items.length === 1) {
            focusStage();
          }
          setQueue((current) => current.filter((item) => item.id !== id));
          announce('Notification dismissed.');
        }}
        onDismissAll={() => {
          focusStage();
          setQueue([]);
          announce('All notifications dismissed.');
        }}
      />
      {!hasNotifications && (
        <Text className="toast-queue-empty" size="body-s">
          No notifications
        </Text>
      )}
      <VisuallyHidden role="status" aria-atomic="true">
        <span key={announcement.sequence}>{announcement.text}</span>
      </VisuallyHidden>
    </div>
  );
}

export function ToastStack({ ctx }: PreviewProps): ReactElement {
  return <Queue ctx={ctx} />;
}

export function ToastReading({ ctx }: PreviewProps): ReactElement {
  return <Queue ctx={ctx} reading />;
}
