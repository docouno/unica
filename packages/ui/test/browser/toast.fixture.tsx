import { Activity, useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { registerOverlay } from '../../src/core/overlay/runtime.js';
import type { OverlayHandle } from '../../src/core/overlay/runtime.js';
import { Toast, ToastProvider, ToastViewport, UnicaProvider } from '../../src/index.js';
import type { ToastMessages, ToastStore } from '../../src/index.js';

const localLabels = { regionLabel: 'Local notifications' };
const siblingLabels = { regionLabel: 'Neighbor notifications' };
const shadowLabels = { regionLabel: 'Shadow notifications' };
const closedLabels = { regionLabel: 'Closed shadow notifications' };
const translated: Partial<ToastMessages> = {
  regionLabel: 'Results',
  actionsLabel: 'Result controls',
  listLabel: 'Result list',
  dismissAll: 'Clear',
  dismissAllLabel: (count) => `Clear all ${count} results`,
  expand: (count) => `Open ${count} results`,
  collapse: (count) => `Close ${count} results`,
};

export default function ToastFixture(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const modal = useRef<OverlayHandle>(null);
  const global = useRef<ToastStore>(null);
  const local = useRef<ToastStore>(null);
  const sibling = useRef<ToastStore>(null);
  const shadow = useRef<ToastStore>(null);
  const closedShadow = useRef<ToastStore>(null);
  const shadowHost = useRef<HTMLDivElement>(null);
  const closedHost = useRef<HTMLDivElement>(null);
  const fallback = useRef<HTMLButtonElement>(null);
  const [localHost, setLocalHost] = useState<HTMLDivElement | null>(null);
  const [siblingHost, setSiblingHost] = useState<HTMLDivElement | null>(null);
  const [shadowScope, setShadowScope] = useState<HTMLElement | null>(null);
  const [closedScope, setClosedScope] = useState<HTMLElement | null>(null);
  const [translate, setTranslate] = useState(false);
  const [alternative, setAlternative] = useState(false);
  const [hideViewport, setHideViewport] = useState(false);
  const [suspendViewport, setSuspendViewport] = useState(false);
  const [actions, setActions] = useState<string[]>([]);
  const record = (text: string): void => setActions((items) => [...items, text]);

  useLayoutEffect(() => {
    const native = dialog.current!;
    const handle = registerOverlay({
      element: native,
      kind: 'modal',
      onOpenChange: (open) => handle.setOpen(open),
    });
    modal.current = handle;
    return () => {
      modal.current = null;
      handle.dispose();
    };
  }, []);
  useLayoutEffect(() => {
    const mount = shadowHost.current!;
    const root = mount.shadowRoot ?? mount.attachShadow({ mode: 'open' });
    const scope =
      root.querySelector('section') ??
      root.appendChild(mount.ownerDocument.createElement('section'));
    setShadowScope(scope);
    const closed = closedHost.current!;
    const privateRoot = closed.attachShadow({ mode: 'closed' });
    const field = privateRoot.appendChild(closed.ownerDocument.createElement('input'));
    field.id = 'closed-field';
    setClosedScope(privateRoot.appendChild(closed.ownerDocument.createElement('section')));
  }, []);

  useLayoutEffect(() => {
    const api = {
      global: global.current,
      local: local.current,
      sibling: sibling.current,
      shadow: shadow.current,
      closedShadow: closedShadow.current,
      closedScope,
      open: () => modal.current?.setOpen(true),
      close: () => modal.current?.setOpen(false),
    };
    Reflect.set(window, 'toastFixture', api);
    return () => {
      Reflect.deleteProperty(window, 'toastFixture');
    };
  });

  return (
    <>
      <button type="button" onClick={() => modal.current?.setOpen(true)}>
        Open editor
      </button>
      <button type="button" id="origin-a">
        Origin A
      </button>
      <button type="button" id="origin-b">
        Origin B
      </button>
      <button type="button" ref={fallback}>
        Fallback
      </button>
      <button type="button" onClick={() => setTranslate((previous) => !previous)}>
        Translate
      </button>
      <button type="button" onClick={() => setAlternative((previous) => !previous)}>
        Switch viewport
      </button>
      <button type="button" onClick={() => setHideViewport((previous) => !previous)}>
        {hideViewport ? 'Show viewport' : 'Hide viewport'}
      </button>
      <button type="button" onClick={() => setSuspendViewport((previous) => !previous)}>
        {suspendViewport ? 'Reveal first viewport' : 'Suspend first viewport'}
      </button>
      <output data-activities="">{actions.join(' ')}</output>
      <ToastProvider ref={global} messages={translate ? translated : undefined}>
        {!alternative && (
          <Activity mode={suspendViewport ? 'hidden' : 'visible'}>
            <ToastViewport
              placement="top-start"
              fallbackFocusRef={fallback}
              data-global=""
              style={{ visibility: hideViewport ? 'hidden' : undefined }}
            />
          </Activity>
        )}
        <ToastViewport placement="top-start" fallbackFocusRef={fallback} data-alternative="" />
      </ToastProvider>
      <dialog
        ref={dialog}
        id="export-editor"
        aria-label="Export editor"
        style={{ width: 280, minHeight: 160 }}
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            record('submit');
          }}
          onReset={() => record('reset')}
        >
          <label>
            File name
            <input name="name" defaultValue="Report" />
          </label>
          <button type="button" onClick={() => modal.current?.setOpen(false)}>
            Close editor
          </button>
          <button
            type="button"
            onClick={() => {
              global.current?.show({
                title: 'Global result',
                status: 'danger',
                action: { label: 'Retry global', onClick: () => record('global') },
              });
              local.current?.show({
                title: 'Local result',
                status: 'danger',
                action: { label: 'Retry local', onClick: () => record('local') },
              });
            }}
          >
            Finish jobs
          </button>
          <Toast
            title="Inline result"
            action={{ label: 'Run inline action', onClick: () => record('inline') }}
          />
          <div
            id="local-host"
            ref={setLocalHost}
            dir="rtl"
            data-theme="pixel-light"
            style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
          >
            <UnicaProvider portalContainer={localHost}>
              <ToastProvider ref={local} messages={localLabels}>
                <ToastViewport placement="bottom-start" />
              </ToastProvider>
            </UnicaProvider>
          </div>
        </form>
      </dialog>
      <div
        id="neighbor-wrapper"
        popover="manual"
        style={{
          position: 'fixed',
          inset: 0,
          margin: 0,
          border: 0,
          pointerEvents: 'none',
          background: 'transparent',
        }}
      >
        <div
          id="neighbor-host"
          ref={setSiblingHost}
          style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}
        >
          <UnicaProvider portalContainer={siblingHost}>
            <ToastProvider ref={sibling} messages={siblingLabels}>
              <ToastViewport placement="bottom-end" />
            </ToastProvider>
          </UnicaProvider>
        </div>
      </div>
      <div id="toast-shadow-host" ref={shadowHost} />
      <UnicaProvider portalContainer={shadowScope}>
        <ToastProvider ref={shadow} messages={shadowLabels}>
          <ToastViewport data-shadow="" />
        </ToastProvider>
      </UnicaProvider>
      <div id="toast-closed-host" ref={closedHost} />
      <UnicaProvider portalContainer={closedScope}>
        <ToastProvider ref={closedShadow} messages={closedLabels}>
          <ToastViewport data-closed-shadow="" />
        </ToastProvider>
      </UnicaProvider>
    </>
  );
}
