import { useLayoutEffect, useRef } from 'react';
import type { JSX } from 'react';
import { positionOverlay } from '../../src/core/overlay/positioning.js';
import {
  registerOverlay,
  resolveToastPortalHost,
  subscribeToModalChanges,
} from '../../src/core/overlay/runtime.js';

const overlap = {
  position: 'fixed',
  inset: '120px auto auto 160px',
  margin: 0,
  width: 220,
  height: 180,
} as const;

export default function OverlayFixture(): JSX.Element {
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const fixture = root.current!;
    const get = <T extends HTMLElement = HTMLElement>(id: string): T =>
      fixture.querySelector<T>(`#${id}`)!;
    const { style } = document.documentElement;
    style.setProperty('overflow-y', 'auto', 'important');
    style.setProperty('overflow-x', 'clip');
    const p1 = get('p1');
    const p2 = get('p2');
    const manual = get('manual');
    const dialog = get<HTMLDialogElement>('dialog');
    const confirm = get<HTMLDialogElement>('confirm');
    const guarded = get('guarded');
    const positioned = get('positioned');
    const trigger2 = get('trigger2');
    const nestedTrigger = get('nested-trigger');
    const stats = get('stats');
    const report = (key: string): void => {
      stats.dataset[key] = String(Number(stats.dataset[key] ?? 0) + 1);
    };

    let ignoreDismiss = false;
    let animated = false;
    let guard = true;
    let stopPositioning: (() => void) | undefined;
    function popover(
      element: HTMLElement,
      trigger: HTMLElement | null,
      kind: 'auto' | 'manual',
      passive = false,
    ) {
      const handle = registerOverlay({
        element,
        kind,
        trigger,
        ...(kind === 'manual' ? { passive } : {}),
        onOpenChange(open, reason) {
          report(`${element.id}Changes`);
          stats.dataset.reason = reason;
          if (!open && animated && element === p2 && reason === 'trigger') {
            handle.beginExit();
          } else if (open || !ignoreDismiss) {
            handle.setOpen(open);
          }
        },
      });
      return handle;
    }
    const a = popover(p1, get('trigger1'), 'auto');
    const b = popover(p2, trigger2, 'auto');
    const m = popover(manual, null, 'manual');
    const passive = popover(get('passive'), null, 'manual', true);
    const panel = popover(guarded, nestedTrigger, 'auto');
    const floating = popover(positioned, get('anchor'), 'manual');
    const nestedPositioned = get('nested-positioned');
    const nestedFloating = popover(nestedPositioned, get('nested-anchor'), 'manual');
    const toastHost = get('modal-host');
    const unsubscribe = subscribeToModalChanges(document, () => {
      stats.dataset.toastHost = resolveToastPortalHost(toastHost)?.id ?? 'none';
      report('projection');
    });
    const d1 = registerOverlay({
      kind: 'modal',
      element: dialog,
      trigger: get('modal-trigger'),
      isDismissGuarded: () => guard,
      onOpenChange(_open, reason) {
        report('guard');
        stats.dataset.reason = reason;
        if (guard && reason === 'escape') {
          d2.setOpen(true);
        } else if (!guard) {
          d1.setOpen(false);
        }
      },
    });
    const d2 = registerOverlay({
      kind: 'modal',
      element: confirm,
      onOpenChange() {
        report('confirmRequests');
      },
    });

    const openModal = (): void => d1.setOpen(true);
    const dismissConfirm = (): void => d2.setOpen(false);
    const closeModal = (): void => d1.setOpen(false);
    const modalTrigger = get('modal-trigger');
    modalTrigger.addEventListener('click', openModal);
    get('dismiss-confirm').addEventListener('click', dismissConfirm);
    get('close-modal').addEventListener('click', closeModal);

    const commands: Record<string, () => void> = {
      'open-a': () => a.setOpen(true),
      'open-b': () => b.setOpen(true),
      'open-manual': () => m.setOpen(true),
      'open-passive': () => passive.setOpen(true),
      'ignore-dismiss': () => {
        ignoreDismiss = true;
      },
      animate: () => {
        animated = true;
      },
      'finish-b': () => b.finishExit(),
      'open-dialog': openModal,
      'close-dialog': closeModal,
      'close-confirm': dismissConfirm,
      'open-confirm': () => d2.setOpen(true),
      'open-guarded': () => panel.setOpen(true),
      'disable-guard': () => {
        guard = false;
      },
      'foreign-modal': () => get<HTMLDialogElement>('foreign').showModal(),
      'remove-trigger': () => trigger2.remove(),
      'replace-trigger': () => b.setTrigger(get('replacement')),
      'move-panel': () => p1.appendChild(p2),
      'move-dialog': () => toastHost.appendChild(dialog),
      'remove-dialog-host': () => toastHost.remove(),
      'native-close': () => dialog.close(),
      'native-cancel': () => dialog.requestClose(),
      'dispose-dialog': () => d1.dispose(),
      'abort-admission': () => {
        dialog.addEventListener('beforetoggle', (event) => event.preventDefault(), { once: true });
        d1.setOpen(true);
      },
      'dispose-on-admission': () => {
        dialog.addEventListener('beforetoggle', () => d1.dispose(), { once: true });
        d1.setOpen(true);
      },
      'open-positioned': () => {
        floating.setOpen(true);
        stopPositioning = positionOverlay({
          anchor: get('anchor'),
          floating: positioned,
          side: 'bottom',
          align: 'start',
          gap: 6,
        });
      },
      'replace-anchor': () => {
        // The second binding starts before the first computePosition microtask completes.
        commands['open-positioned']!();
        const cleanup = stopPositioning!;
        stopPositioning = positionOverlay({
          anchor: get('anchor2'),
          floating: positioned,
          side: 'end',
          align: 'start',
          gap: 8,
        });
        cleanup();
      },
      'close-positioned': () => {
        stopPositioning?.();
        floating.finishExit();
      },
      'nested-positioned': () => {
        d1.setOpen(true);
        nestedFloating.setOpen(true);
        stopPositioning = positionOverlay({
          anchor: get('nested-anchor'),
          floating: nestedPositioned,
          side: 'bottom',
          align: 'start',
          gap: 6,
        });
      },
      'reenter-show': () => {
        get('inside-a').addEventListener('focus', () => m.setOpen(true), { once: true });
        a.setOpen(true);
      },
    };
    const command = (event: Event): void => commands[(event as CustomEvent<string>).detail]?.();
    fixture.addEventListener('fixture-command', command);
    return () => {
      fixture.removeEventListener('fixture-command', command);
      modalTrigger.removeEventListener('click', openModal);
      get('dismiss-confirm').removeEventListener('click', dismissConfirm);
      get('close-modal')?.removeEventListener('click', closeModal);
      unsubscribe();
      stopPositioning?.();
      [nestedFloating, floating, panel, passive, m, b, a, d2, d1].forEach((handle) =>
        handle.dispose(),
      );
      style.removeProperty('overflow');
    };
  }, []);

  return (
    <div
      ref={root}
      id="overlay-fixture"
      style={{ minHeight: 2400 }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          const stats = root.current!.querySelector<HTMLElement>('#stats')!;
          stats.dataset.escapes = String(Number(stats.dataset.escapes ?? 0) + 1);
        }
      }}
    >
      <output id="stats" data-toast-host="modal-host" />
      <button id="trigger1" type="button">
        Open outer
      </button>
      <button id="outside" type="button">
        Outside target
      </button>
      <div id="p1" style={overlap}>
        <button id="inside-a" type="button" autoFocus>
          Outer action
        </button>
        <button
          id="trigger2"
          type="button"
          style={{ position: 'absolute', top: 38, left: 0, width: 75 }}
        >
          Open inner
        </button>
        <button
          id="replacement"
          type="button"
          style={{ position: 'absolute', top: 90, left: 0, width: 75 }}
        >
          Replacement trigger
        </button>
        <div id="p2" style={{ ...overlap, left: 240 }}>
          <button id="modal-trigger" type="button">
            Edit in modal
          </button>
        </div>
      </div>
      <div id="manual" style={{ ...overlap, left: 205 }}>
        <button id="inside-manual" type="button">
          Manual action
        </button>
      </div>
      <div id="passive" style={{ position: 'fixed', inset: '10px 10px auto auto', margin: 0 }}>
        Passive notice
      </div>
      <div id="modal-host">
        <dialog
          id="dialog"
          aria-label="Edit item"
          style={{ height: 235, width: 300, overflow: 'auto' }}
        >
          <label>
            Name <input id="draft" defaultValue="draft" />
          </label>
          <button id="nested-trigger" type="button">
            Open choices
          </button>
          <div id="guarded">
            <button id="nested-action" type="button">
              Choice
            </button>
          </div>
          <button id="close-modal" type="button">
            Close editor
          </button>
          <div id="nested-clip" style={{ overflow: 'hidden', contain: 'paint', height: 32 }}>
            <button id="nested-anchor" type="button">
              Nested anchor
            </button>
            <div id="nested-positioned">
              <button id="nested-positioned-action" type="button">
                Nested action
              </button>
            </div>
          </div>
          <div style={{ height: 800 }} />
        </dialog>
        <dialog id="confirm" aria-label="Confirm changes">
          <button id="dismiss-confirm" type="button">
            Keep editing
          </button>
        </dialog>
      </div>
      <dialog id="foreign" aria-label="Foreign modal">
        <button id="foreign-action" type="button">
          Foreign
        </button>
      </dialog>
      <div
        id="clip"
        style={{
          position: 'fixed',
          overflow: 'hidden',
          contain: 'paint',
          transform: 'translateX(0)',
          top: 380,
          left: 200,
          width: 400,
          height: 32,
        }}
      >
        <button id="anchor" type="button" style={{ position: 'absolute', left: 20, width: 80 }}>
          Anchor
        </button>
        <button id="anchor2" type="button" style={{ position: 'absolute', left: 250, width: 100 }}>
          New anchor
        </button>
        <div id="positioned" style={{ width: 160, padding: 0 }}>
          <button
            id="positioned-action"
            type="button"
            style={{ width: '100%' }}
            onClick={() => {
              const stats = root.current!.querySelector<HTMLElement>('#stats')!;
              stats.dataset.positionedClicks = String(
                Number(stats.dataset.positionedClicks ?? 0) + 1,
              );
            }}
          >
            Positioned action
          </button>
        </div>
      </div>
    </div>
  );
}
