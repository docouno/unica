import { useCallback, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { JSX } from 'react';
import { Portal, usePortalContainer } from '../../src/index.js';
import {
  registerOverlay,
  resolveToastPortalHost,
  subscribeToModalChanges,
} from '../../src/core/overlay/runtime.js';

const probeStyle = { fontSize: 'var(--text-size-body-m)', color: 'var(--fg-primary)' };

export function PortalProbe({
  subject,
}: {
  readonly subject?: { readonly 'data-wb-subject': '' };
} = {}): JSX.Element {
  return (
    <>
      <span data-inline-probe="" {...subject} style={probeStyle}>
        Inline probe
      </span>
      <Portal>
        <span data-portal-probe="" style={probeStyle}>
          Portal probe
        </span>
      </Portal>
    </>
  );
}

function PortaledDialogForm({
  subject,
  form,
  onHandle,
}: {
  readonly subject: { readonly 'data-wb-subject': '' };
  readonly form: { readonly 'data-wb-form': '' };
  readonly onHandle: (handle: ReturnType<typeof registerOverlay> | null) => void;
}): JSX.Element {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useLayoutEffect(() => {
    const handle = registerOverlay({
      kind: 'modal',
      element: dialogRef.current!,
      onOpenChange(open) {
        handle.setOpen(open);
      },
    });
    onHandle(handle);
    return () => {
      onHandle(null);
      handle.dispose();
    };
  }, [onHandle]);

  return (
    <dialog
      ref={dialogRef}
      {...subject}
      aria-label="Portaled dialog"
      style={{ width: 240, height: 120 }}
    >
      <form {...form}>
        <input name="owner" defaultValue="unica" />
        <button type="submit">Save</button>
      </form>
    </dialog>
  );
}

export function PortaledDialogFormProbe({
  subject,
  form,
}: {
  readonly subject: { readonly 'data-wb-subject': '' };
  readonly form: { readonly 'data-wb-form': '' };
}): JSX.Element {
  const handleRef = useRef<ReturnType<typeof registerOverlay>>(null);
  const attachHandle = useCallback((handle: ReturnType<typeof registerOverlay> | null) => {
    handleRef.current = handle;
  }, []);

  return (
    <>
      <button
        type="button"
        data-open-portaled-dialog=""
        onClick={() => handleRef.current?.setOpen(true)}
      >
        Open portaled dialog
      </button>
      <Portal>
        <PortaledDialogForm subject={subject} form={form} onHandle={attachHandle} />
      </Portal>
    </>
  );
}

function Viewport({
  ids,
  onAction,
  global,
}: {
  readonly ids: readonly number[];
  readonly onAction: () => void;
  readonly global: boolean;
}): JSX.Element {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const handle = registerOverlay({
      kind: 'manual',
      element: ref.current!,
      passive: true,
      onOpenChange() {},
    });
    handle.setOpen(true);
    return handle.dispose;
  }, []);
  return (
    <div
      ref={ref}
      data-toast-viewport=""
      style={{ position: 'fixed', inset: `${global ? 64 : 16}px 16px auto auto`, margin: 0 }}
    >
      {ids.map((id) => (
        <button data-message-id={id} key={id} type="button" onClick={onAction}>
          {global ? 'Global action' : 'Scoped action'} {id}
        </button>
      ))}
    </div>
  );
}

export function ToastQueue({ global = false }: { readonly global?: boolean }): JSX.Element {
  const scope = usePortalContainer();
  const container = global ? document.body : scope;
  const subscribe = useCallback(
    (notify: () => void) =>
      container ? subscribeToModalChanges(container.ownerDocument, notify) : () => {},
    [container],
  );
  const host = useSyncExternalStore(subscribe, () => resolveToastPortalHost(container));
  const [ids, setIds] = useState([1]);
  const [actions, setActions] = useState(0);
  return (
    <>
      {!global && (
        <button
          type="button"
          data-enqueue=""
          onClick={() => setIds((old) => [...old, old.length + 1])}
        >
          Enqueue
        </button>
      )}
      <output
        data-queue={global ? 'global' : 'scoped'}
        data-announcements={ids.length}
        data-actions={actions}
      />
      <Portal container={host}>
        <Viewport ids={ids} onAction={() => setActions((old) => old + 1)} global={global} />
      </Portal>
    </>
  );
}

function Dialog({
  label,
  onHandle,
}: {
  readonly label: string;
  readonly onHandle: (handle: ReturnType<typeof registerOverlay> | null) => void;
}): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const handle = useRef<ReturnType<typeof registerOverlay>>(null);
  useLayoutEffect(() => {
    const layer = registerOverlay({
      kind: 'modal',
      element: dialog.current!,
      onOpenChange(open) {
        layer.setOpen(open);
      },
    });
    handle.current = layer;
    onHandle(layer);
    return () => {
      onHandle(null);
      layer.dispose();
    };
  }, [onHandle]);

  return (
    <dialog ref={dialog} aria-label={label} style={{ minWidth: 260, minHeight: 120 }}>
      <button type="button" onClick={() => handle.current?.setOpen(false)}>
        Close {label}
      </button>
    </dialog>
  );
}

export function OverlayScene(): JSX.Element {
  const editor = useRef<ReturnType<typeof registerOverlay>>(null);
  const confirm = useRef<ReturnType<typeof registerOverlay>>(null);
  const attachEditor = useCallback((handle: ReturnType<typeof registerOverlay> | null) => {
    editor.current = handle;
  }, []);
  const attachConfirm = useCallback((handle: ReturnType<typeof registerOverlay> | null) => {
    confirm.current = handle;
  }, []);

  return (
    <>
      <PortalProbe />
      <ToastQueue />
      <button type="button" data-dialog-trigger="" onClick={() => editor.current?.setOpen(true)}>
        Open editor
      </button>
      <button type="button" data-confirm-trigger="" onClick={() => confirm.current?.setOpen(true)}>
        Open confirmation
      </button>
      <Portal>
        <Dialog label="Editor" onHandle={attachEditor} />
        <Dialog label="Confirmation" onHandle={attachConfirm} />
      </Portal>
    </>
  );
}
