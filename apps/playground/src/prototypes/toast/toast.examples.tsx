import { useEffect, useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { createPortal } from 'react-dom';
import { Button } from '@docouno/unica';
import { ToastCard, ToastViewport } from './toast.proto.js';
import type { ToastItem, ToastPlacement, ToastStatus } from './toast.proto.js';
import './toast.examples.css';

const noop = (): void => {};
const initialItems: readonly ToastItem[] = [
  {
    id: 'sync',
    status: 'info',
    title: 'Sync is up to date',
  },
  {
    id: 'export',
    status: 'success',
    title: 'Export ready',
    children: 'Your PDF includes all 12 pages.',
    action: { label: 'View file', onClick: noop },
  },
  {
    id: 'save',
    status: 'danger',
    title: 'Changes could not be saved',
    children: 'Your draft is safe on this device. Check your connection and try again.',
    action: { label: 'Retry', onClick: noop },
  },
  {
    id: 'archive',
    status: 'neutral',
    title: 'Document archived',
    action: { label: 'Undo', onClick: noop },
  },
];

const readingItems: readonly ToastItem[] = [
  { id: 'backup', status: 'success', title: 'Backup complete' },
  { id: 'comments', title: 'Comments marked as read' },
  { id: 'preferences', status: 'info', title: 'Preferences synced' },
  {
    id: 'shared',
    status: 'info',
    title: 'A link was shared with you',
    children: 'The project brief is available in your workspace.',
  },
  {
    id: 'import',
    status: 'warning',
    title: '2 files were skipped',
    children: 'The other 18 files were imported.',
  },
  {
    id: 'invite',
    status: 'success',
    title: 'Invitation sent',
    children: 'Your teammate can join from the link in their email.',
  },
  ...initialItems,
];

export function ToastRoles(): ReactElement {
  const roles: readonly {
    status: ToastStatus;
    title: string;
    description?: string;
    action?: string;
  }[] = [
    { status: 'neutral', title: 'Link copied' },
    {
      status: 'info',
      title: 'A new version is available',
      description: 'Refresh when you are ready to continue.',
      action: 'Refresh',
    },
    {
      status: 'success',
      title: 'Changes saved',
      description: 'Your team can see the latest version.',
    },
    {
      status: 'warning',
      title: '3 files were skipped',
      description: 'The remaining 21 files were imported.',
      action: 'Review files',
    },
    {
      status: 'danger',
      title: 'Changes could not be saved',
      description: 'Your draft is safe on this device.',
      action: 'Retry',
    },
  ];
  return (
    <div className="toast-examples-stack">
      {roles.map(({ status, title, description, action }) => (
        <ToastCard
          key={status}
          status={status}
          title={title}
          onDismiss={noop}
          action={action ? { label: action, onClick: noop } : undefined}
        >
          {description}
        </ToastCard>
      ))}
      <ToastCard loading title="Preparing your export" onDismiss={noop}>
        You can keep working. We will let you know when it is ready.
      </ToastCard>
    </div>
  );
}

export function ToastAnatomy(): ReactElement {
  const [removed, setRemoved] = useState(false);
  const undoExample = useRef<HTMLDivElement>(null);
  return (
    <div className="toast-examples-stack">
      <div className="toast-example">
        <span className="toast-example-label">One line · no action</span>
        <ToastCard title="Link copied" onDismiss={noop} />
      </div>
      <div className="toast-example" ref={undoExample}>
        <span className="toast-example-label">Short action · inline when it fits</span>
        <ToastCard
          status={removed ? 'success' : 'neutral'}
          title={removed ? 'Document restored' : 'Document archived'}
          onDismiss={noop}
          action={
            removed
              ? undefined
              : {
                  label: 'Undo',
                  onClick: () => {
                    setRemoved(true);
                    requestAnimationFrame(() =>
                      undoExample.current
                        ?.querySelector<HTMLButtonElement>('.toast-dismiss')
                        ?.focus(),
                    );
                  },
                }
          }
        />
        {removed && (
          <Button size="s" variant="ghost" tone="neutral" onClick={() => setRemoved(false)}>
            Reset example
          </Button>
        )}
      </div>
      <div className="toast-example">
        <span className="toast-example-label">Details · action follows the copy</span>
        <ToastCard
          status="danger"
          title="Upload interrupted"
          onDismiss={noop}
          action={{ label: 'Retry upload', onClick: noop }}
        >
          Your connection was lost. The original file has not changed.
        </ToastCard>
      </div>
      <div className="toast-example">
        <span className="toast-example-label">
          No close control · only for a brief confirmation
        </span>
        <ToastCard status="success" title="Settings saved" />
      </div>
    </div>
  );
}

export function ToastControlStates(): ReactElement {
  return (
    <div className="toast-examples-stack">
      <div className="toast-example">
        <span className="toast-example-label">Hover, hold, or Tab to Undo and Dismiss</span>
        <ToastCard
          title="Document archived"
          action={{ label: 'Undo', onClick: noop }}
          onDismiss={noop}
        />
      </div>
      <div className="toast-example">
        <span className="toast-example-label">Action unavailable · close remains available</span>
        <ToastCard
          status="warning"
          title="Download is unavailable"
          onDismiss={noop}
          action={{ label: 'Download', disabled: true }}
        >
          This file is being scanned. Try again when the scan finishes.
        </ToastCard>
      </div>
      <div className="toast-example">
        <span className="toast-example-label">
          Action pending · stable label and keyboard focus
        </span>
        <ToastCard
          status="danger"
          title="Changes could not be saved"
          onDismiss={noop}
          action={{ label: 'Retry', pending: true }}
        >
          Your draft is safe on this device.
        </ToastCard>
      </div>
    </div>
  );
}

export function ToastQueueExample({
  initialExpanded = false,
}: {
  readonly initialExpanded?: boolean;
}): ReactElement {
  const startingItems = initialExpanded ? readingItems : initialItems;
  const [items, setItems] = useState<readonly ToastItem[]>(startingItems);
  const [placement, setPlacement] = useState<ToastPlacement>('bottom-end');
  const [event, setEvent] = useState('');
  const counter = useRef(0);
  const controls = useRef<HTMLDivElement>(null);
  const id = useId();
  const reset = (): void => {
    setItems(startingItems);
    setEvent('');
  };
  const dismissAll = (): void => {
    setItems([]);
    setEvent('All notifications dismissed.');
    requestAnimationFrame(() =>
      controls.current?.querySelector<HTMLButtonElement>('button')?.focus(),
    );
  };
  const actionItems = items.map((item) => ({
    ...item,
    action: item.action
      ? {
          ...item.action,
          onClick: () => {
            setEvent(
              item.id === 'archive'
                ? 'Document restored.'
                : item.id === 'save'
                  ? 'Retry requested. Use the operation example to inspect its states.'
                  : 'File opened in this local preview.',
            );
            if (item.id !== 'save') {
              const active = document.activeElement;
              const root = controls.current?.parentElement;
              const cards = [...(root?.querySelectorAll<HTMLElement>('.toast-card') ?? [])];
              const index = cards.findIndex((card) => card.contains(active));
              setItems((current) => current.filter((entry) => entry.id !== item.id));
              if (index >= 0) {
                requestAnimationFrame(() => {
                  if (active?.isConnected || document.activeElement !== document.body) {
                    return;
                  }
                  const remaining = [...(root?.querySelectorAll<HTMLElement>('.toast-card') ?? [])];
                  const next = remaining[Math.min(index, remaining.length - 1)];
                  const target =
                    next?.querySelector<HTMLButtonElement>(
                      'button:not([disabled]):not([aria-disabled="true"])',
                    ) ?? controls.current?.querySelector<HTMLButtonElement>('button');
                  target?.focus();
                });
              }
            }
          },
        }
      : undefined,
  }));
  return (
    <div className="toast-example-panel">
      <div className="toast-example-tools" ref={controls}>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            const next = ++counter.current;
            setItems((current) => [
              ...current,
              {
                id: `new-${next}`,
                status: 'success',
                title: `Export ${next} is ready`,
                children: 'The file is available in your downloads.',
              },
            ]);
          }}
        >
          Add notification
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={reset}>
          Reset queue
        </Button>
        <label htmlFor={id}>Position</label>
        <select
          id={id}
          value={placement}
          onChange={(event) => setPlacement(event.target.value as ToastPlacement)}
        >
          {(
            [
              'bottom-end',
              'bottom-center',
              'bottom-start',
              'top-end',
              'top-center',
              'top-start',
            ] as const
          ).map((value) => (
            <option key={value}>{value}</option>
          ))}
        </select>
      </div>
      <div className="toast-demo-stage" data-queue-stage>
        <ToastViewport
          items={actionItems}
          placement={placement}
          initialExpanded={initialExpanded}
          onDismiss={(itemId) => {
            setItems((current) => current.filter((item) => item.id !== itemId));
            setEvent('Notification dismissed.');
            if (items.length === 1) {
              requestAnimationFrame(() =>
                controls.current?.querySelector<HTMLButtonElement>('button')?.focus(),
              );
            }
          }}
          onDismissAll={dismissAll}
        />
        {items.length === 0 && (
          <p className="toast-example-empty">
            The workspace is clear.
            <br />
            Add a notification or reset the queue.
          </p>
        )}
      </div>
      <p className="toast-example-note" role="status">
        {event ||
          'Add a notification to see it appear directly in the open list. Timers are pinned in this preview.'}
      </p>
    </div>
  );
}

export function ToastOverflow(): ReactElement {
  return (
    <div className="toast-examples-stack">
      <ToastCard
        status="success"
        title="The quarterly accessibility review has been shared with your team"
        onDismiss={noop}
        action={{ label: 'View document', onClick: noop }}
      />
      <ToastCard
        status="danger"
        title="This file could not be uploaded"
        onDismiss={noop}
        action={{ label: 'Choose a different destination', onClick: noop }}
      >
        <bdi>workspace_export_2026_11_final_accessibility_review_v12.pdf</bdi> exceeds the
        destination limit. Your original file is unchanged.
      </ToastCard>
      <ToastCard
        status="info"
        title="A new comment on your document"
        onDismiss={noop}
        action={{ label: 'View comment', onClick: noop }}
      >
        <bdi dir="ltr">Product guidelines · v2.pdf</bdi>
        <br />
        The selected paragraph has a new review note.
      </ToastCard>
      <ToastCard
        status="neutral"
        title="8 documents archived"
        action={{ label: 'Restore all 8 documents', onClick: noop }}
        onDismiss={noop}
      />
    </div>
  );
}

export function ToastOperation(): ReactElement {
  const [phase, setPhase] = useState<'loading' | 'success' | 'failure' | 'retry'>('loading');
  const [visible, setVisible] = useState(true);
  const [message, setMessage] = useState('');
  return (
    <div className="toast-example-panel">
      <div className="toast-example-tools">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            setPhase('success');
            setVisible(true);
          }}
        >
          Resolve
        </Button>
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            setPhase('failure');
            setVisible(true);
          }}
        >
          Reject
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          onClick={() => {
            setPhase('loading');
            setVisible(true);
            setMessage('');
          }}
        >
          Restart
        </Button>
      </div>
      <div className="toast-operation-slot">
        {visible ? (
          <ToastCard
            loading={phase === 'loading'}
            status={phase === 'success' ? 'success' : phase === 'loading' ? 'neutral' : 'danger'}
            title={
              phase === 'loading'
                ? 'Preparing your export'
                : phase === 'success'
                  ? 'Export ready'
                  : 'Export could not be completed'
            }
            onDismiss={() => {
              setVisible(false);
              setMessage('Notification hidden. The operation is not cancelled.');
            }}
            action={
              phase === 'success'
                ? {
                    label: 'View file',
                    onClick: () => setMessage('File opened in this local preview.'),
                  }
                : phase === 'failure' || phase === 'retry'
                  ? { label: 'Retry', pending: phase === 'retry', onClick: () => setPhase('retry') }
                  : undefined
            }
          >
            {phase === 'loading'
              ? 'You can keep working. We will let you know when it is ready.'
              : phase === 'success'
                ? 'Your PDF includes all 12 pages.'
                : phase === 'retry'
                  ? 'Trying again. Your documents are unchanged.'
                  : 'The connection was interrupted. Your documents are unchanged.'}
          </ToastCard>
        ) : (
          <p className="toast-example-empty">Notification dismissed.</p>
        )}
      </div>
      <p className="toast-example-note" role="status">
        {message ||
          'Controlled operation preview. Resolve or Reject updates this same card; Retry stays pending until you choose its result.'}
      </p>
    </div>
  );
}

export function ToastLifetime(): ReactElement {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [persistent, setPersistent] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  useEffect(() => {
    const update = (): void => setHidden(document.hidden || !document.hasFocus());
    window.addEventListener('focus', update);
    window.addEventListener('blur', update);
    document.addEventListener('visibilitychange', update);
    return () => {
      window.removeEventListener('focus', update);
      window.removeEventListener('blur', update);
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  const paused = hovered || focused || manualPause || hidden;
  const timing = remaining !== null && remaining > 0 && !paused;
  useEffect(() => {
    if (!timing) {
      return;
    }
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - last;
      last = now;
      setRemaining((current) => (current === null ? null : Math.max(0, current - elapsed)));
    }, 80);
    return () => window.clearInterval(timer);
  }, [timing]);
  return (
    <div className="toast-example-panel">
      <div className="toast-example-tools">
        <Button
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            setRemaining(6000);
            setAnnouncement('Changes saved');
          }}
        >
          Show confirmation
        </Button>
        <Button size="s" variant="secondary" tone="neutral" onClick={() => setPersistent(true)}>
          Show Undo
        </Button>
        <Button
          size="s"
          variant="ghost"
          tone="neutral"
          pressed={manualPause}
          onPressedChange={setManualPause}
        >
          Pause preview
        </Button>
      </div>
      <div
        className="toast-lifetime-stage"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocusCapture={() => setFocused(true)}
        onBlurCapture={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) {
            setFocused(false);
          }
        }}
      >
        {remaining !== null && remaining > 0 && (
          <ToastCard title="Changes saved" status="success" onDismiss={() => setRemaining(0)} />
        )}
        {persistent && (
          <ToastCard
            title="Document archived"
            action={{
              label: 'Undo',
              onClick: () => {
                setPersistent(false);
                setAnnouncement('Document restored');
              },
            }}
            onDismiss={() => setPersistent(false)}
          />
        )}
        {(remaining === null || remaining === 0) && !persistent && (
          <p className="toast-example-empty">Trigger a notification to inspect its lifetime.</p>
        )}
      </div>
      <p className="toast-example-note">
        {remaining !== null
          ? `${(remaining / 1000).toFixed(1)} s remaining${paused ? ' · paused' : ''}`
          : '6 s of available reading time'}{' '}
        ·{' '}
        {[
          hovered && 'pointer inside',
          focused && 'focus inside',
          hidden && 'window inactive',
          manualPause && 'preview pause',
        ]
          .filter(Boolean)
          .join(' + ') || 'no pause reasons'}
        . Undo has no timer. This readout belongs to the preview.
      </p>
      <span className="toast-visually-hidden" role="status">
        {announcement}
      </span>
    </div>
  );
}

export function ToastModal(): ReactElement {
  const [host, setHost] = useState<HTMLDialogElement | null>(null);
  const [items, setItems] = useState<readonly ToastItem[]>([
    {
      id: 'saved',
      status: 'success',
      title: 'Changes saved',
      children: 'Your team can see the latest version.',
    },
  ]);
  const [notice, setNotice] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (host && popover.current && !popover.current.matches(':popover-open')) {
      popover.current.showPopover();
    }
  }, [host]);
  const viewport = (
    <ToastViewport
      items={items}
      onDismiss={(itemId) => {
        setItems((current) => current.filter((item) => item.id !== itemId));
        if (items.length === 1) {
          requestAnimationFrame(() =>
            (host
              ? dialog.current?.querySelector<HTMLInputElement>('input')
              : trigger.current
            )?.focus(),
          );
        }
      }}
      onDismissAll={() => {
        setItems([]);
        requestAnimationFrame(() =>
          (host
            ? dialog.current?.querySelector<HTMLInputElement>('input')
            : trigger.current
          )?.focus(),
        );
      }}
    />
  );
  const close = (): void => {
    dialog.current?.close();
    setHost(null);
    requestAnimationFrame(() => trigger.current?.focus());
  };
  return (
    <div className="toast-example-panel">
      <div className="toast-example-tools">
        <Button
          ref={trigger}
          size="s"
          variant="secondary"
          tone="neutral"
          onClick={() => {
            if (dialog.current) {
              dialog.current.showModal();
              setHost(dialog.current);
            }
          }}
        >
          Open native dialog
        </Button>
        <Button size="s" variant="ghost" tone="neutral" onClick={() => setItems(initialItems)}>
          Reset notifications
        </Button>
      </div>
      <div className="toast-demo-stage toast-demo-stage-modal">
        <div className="toast-modal-preview" aria-hidden="true">
          <strong>Dialog context</strong>
          <p>The notification remains above the dimmed workspace.</p>
        </div>
        {!host && viewport}
      </div>
      <dialog
        ref={dialog}
        className="toast-example-dialog"
        aria-labelledby={id}
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
      >
        <h2 id={id}>Export options</h2>
        <p>This native dialog is a stand-in for the adjacent Modal family.</p>
        <label>
          File name
          <input defaultValue="Workspace export" />
        </label>
        <div className="toast-example-tools">
          <Button
            size="s"
            onClick={() => {
              setItems((current) => [
                ...current,
                {
                  id: `export-${current.length}`,
                  status: 'success',
                  title: 'Export ready',
                  children: 'Your PDF includes all 12 pages.',
                  action: {
                    label: 'View file',
                    onClick: () =>
                      setNotice(
                        'File opened. Toast actions remain reachable inside the active modal.',
                      ),
                  },
                },
              ]);
            }}
          >
            Prepare export
          </Button>
          <Button size="s" variant="secondary" tone="neutral" onClick={close}>
            Close dialog
          </Button>
        </div>
        <p className="toast-example-note" role="status">
          {notice || 'Escape closes the dialog. Outside clicks leave notifications intact.'}
        </p>
      </dialog>
      {host &&
        createPortal(
          <div ref={popover} popover="manual" className="toast-native-host">
            {viewport}
          </div>,
          host,
        )}
      <p className="toast-example-note">
        Open the dialog, add an export, then use View file or ×. Queue state survives host changes.
        The static frame above previews the scrim; the button opens a real native modal.
      </p>
    </div>
  );
}
