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
    const guardedInner = get('guarded-inner');
    const foreignManual = get('foreign-manual');
    const positioned = get('positioned');
    const trigger2 = get('trigger2');
    const nestedTrigger = get('nested-trigger');
    const nestedInnerTrigger = get('nested-inner-trigger');
    const divTrigger = get('div-trigger');
    const divPopover = get('div-popover');
    const clobberedForm = get<HTMLFormElement>('clobbered-form');
    const clobberedTrigger = get('clobbered-trigger');
    const outerNestedTrigger = get('outer-nested-trigger');
    const innerNestedTrigger = get('inner-nested-trigger');
    const outerNestedPopover = get('outer-nested-popover');
    const innerNestedPopover = get('inner-nested-popover');
    const foreignAuto = get('foreign-auto');
    const foreignComboTrigger = get('foreign-combo-trigger');
    const foreignComboPanel = get('foreign-combo-panel');
    const foreignDialogPopover = get<HTMLDialogElement>('foreign-dialog-popover');
    const dialogPopoverTrigger = get('dialog-popover-trigger');
    const dialogPopoverChild = get('dialog-popover-child');
    const manualInP1 = get('manual-in-p1');
    const stats = get('stats');
    const report = (rawKey: string): void => {
      const key = rawKey.replace(/-([a-z])/g, (_, ch: string) => ch.toUpperCase());
      stats.dataset[key] = String(Number(stats.dataset[key] ?? 0) + 1);
    };

    const shadowHost = get('shadow-trigger-host');
    const shadow = shadowHost.attachShadow({ mode: 'open' });
    const shadowButton = shadow.appendChild(document.createElement('button'));
    shadowButton.type = 'button';
    shadowButton.id = 'shadow-button';
    shadowButton.textContent = 'Shadow trigger';
    const shadowPopover = get('shadow-popover');

    let ignoreDismiss = false;
    let animated = false;
    let guard = true;
    let consumeInnerEscape = false;
    let cancelTriggerClick = false;
    let stopPositioning: (() => void) | undefined;

    function popover(
      element: HTMLElement,
      trigger: HTMLElement | null,
      kind: 'auto' | 'manual',
      passive = false,
    ) {
      const id = Element.prototype.getAttribute.call(element, 'id') ?? '';
      const handle = registerOverlay({
        element,
        kind,
        trigger,
        ...(kind === 'manual' ? { passive } : {}),
        onOpenChange(open, reason) {
          report(`${id}Changes`);
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
    const innerPanel = popover(guardedInner, nestedInnerTrigger, 'auto');
    const floating = popover(positioned, get('anchor'), 'manual');
    const nestedPositioned = get('nested-positioned');
    const nestedFloating = popover(nestedPositioned, get('nested-anchor'), 'manual');
    const divHandle = popover(divPopover, divTrigger, 'auto');
    const shadowHandle = popover(shadowPopover, shadowButton, 'auto');
    const clobberedHandle = popover(clobberedForm, clobberedTrigger, 'auto');
    const outerNestedHandle = popover(outerNestedPopover, outerNestedTrigger, 'auto');
    const innerNestedHandle = popover(innerNestedPopover, innerNestedTrigger, 'auto');
    const foreignComboHandle = popover(foreignComboPanel, foreignComboTrigger, 'manual');
    const dialogPopoverChildHandle = popover(dialogPopoverChild, dialogPopoverTrigger, 'auto');
    const manualInP1Handle = popover(manualInP1, null, 'manual');
    let stopClobberedPositioning: (() => void) | undefined;
    const clobberedDocNodes: HTMLElement[] = [];

    const toastHost = get('modal-host');
    const unsubscribe = subscribeToModalChanges(document, () => {
      stats.dataset.toastHost = resolveToastPortalHost(toastHost)?.id ?? 'none';
      report('projection');
    });
    const d1 = registerOverlay({
      kind: 'modal',
      element: dialog,
      trigger: get('modal-trigger'),
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

    const onForeignManualKey = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') {
        return;
      }
      stats.dataset.foreignManualDefaultPrevented = String(event.defaultPrevented);
      if (!event.defaultPrevented) {
        foreignManual.hidePopover();
        report('foreignManualClosed');
      }
    };
    foreignManual.addEventListener('keydown', onForeignManualKey);

    const openModal = (): void => d1.setOpen(true);
    const dismissConfirm = (): void => d2.setOpen(false);
    const closeModal = (): void => d1.setOpen(false);
    const modalTrigger = get('modal-trigger');
    modalTrigger.addEventListener('click', openModal);
    get('dismiss-confirm').addEventListener('click', dismissConfirm);
    get('close-modal').addEventListener('click', closeModal);

    const onTrigger1Click = (event: MouseEvent): void => {
      stats.dataset.trigger1DefaultPrevented = String(event.defaultPrevented);
      if (cancelTriggerClick) {
        event.preventDefault();
      }
    };
    get('trigger1').addEventListener('click', onTrigger1Click);

    const commands: Record<string, () => void> = {
      'open-a': () => a.setOpen(true),
      'open-b': () => b.setOpen(true),
      'open-manual': () => m.setOpen(true),
      'open-passive': () => passive.setOpen(true),
      'make-passive-active': () => passive.update({ passive: undefined }),
      'open-manual-in-p1': () => manualInP1Handle.setOpen(true),
      'position-clobbered': () => {
        stopClobberedPositioning = positionOverlay({
          anchor: get('outside'),
          floating: clobberedForm,
          side: 'bottom',
          align: 'start',
          gap: 6,
        });
      },
      'dispose-clobbered': () => {
        stopClobberedPositioning?.();
        stopClobberedPositioning = undefined;
        clobberedHandle.dispose();
      },
      'clobber-document': () => {
        const specs = [
          { tag: 'form', name: 'defaultView' },
          { tag: 'form', name: 'documentElement', childInput: 'style' },
          { tag: 'img', name: 'body' },
          { tag: 'form', name: 'removeEventListener' },
          { tag: 'form', name: 'dispatchEvent' },
        ];
        for (const spec of specs) {
          const el = document.createElement(spec.tag);
          el.setAttribute('name', spec.name);
          if (spec.childInput) {
            const input = document.createElement('input');
            input.setAttribute('name', spec.childInput);
            el.appendChild(input);
          }
          fixture.appendChild(el);
          clobberedDocNodes.push(el);
        }
      },
      'open-foreign-auto-combo': () => {
        foreignAuto.showPopover();
        foreignComboTrigger.focus();
        foreignComboHandle.setOpen(true);
      },
      'open-dialog-popover-child': () => {
        foreignDialogPopover.showPopover();
        dialogPopoverTrigger.focus();
        dialogPopoverChildHandle.setOpen(true);
      },
      'hide-p1-natively': () => p1.hidePopover(),
      'ignore-dismiss': () => {
        ignoreDismiss = true;
      },
      'dismiss-then-reopen': () => {
        p2.hidePopover();
        b.requestOpen();
      },
      'dismiss-then-controlled-close': () => {
        p2.hidePopover();
        b.setOpen(false);
        b.setOpen(true);
        b.setOpen(false);
      },
      animate: () => {
        animated = true;
      },
      'begin-exit-b': () => b.beginExit(),
      'reopen-b': () => b.setOpen(true),
      'finish-b': () => b.finishExit(),
      'finish-b-no-focus': () => b.finishExit({ returnFocus: false }),
      'hide-b-natively': () => p2.hidePopover(),
      'begin-exit-dialog': () => d1.beginExit(),
      'reopen-dialog': () => d1.setOpen(true),
      'open-dialog': openModal,
      'close-dialog': closeModal,
      'close-confirm': dismissConfirm,
      'open-confirm': () => d2.setOpen(true),
      'open-guarded': () => panel.setOpen(true),
      'open-guarded-inner': () => innerPanel.setOpen(true),
      'disable-guard': () => {
        guard = false;
      },
      'consume-inner-escape': () => {
        consumeInnerEscape = true;
      },
      'cancel-trigger1-click': () => {
        cancelTriggerClick = true;
      },
      'update-b-callback': () => {
        b.update({
          onOpenChange(open, reason) {
            report('updatedCallback');
            stats.dataset.reason = reason;
            b.setOpen(open);
          },
        });
      },
      'disable-trigger2': () => {
        (trigger2 as HTMLButtonElement).disabled = true;
      },
      'foreign-modal': () => get<HTMLDialogElement>('foreign').showModal(),
      'foreign-manual': () => foreignManual.showPopover(),
      'foreign-manual-in-dialog': () => {
        dialog.appendChild(foreignManual);
        foreignManual.showPopover();
      },
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
      'set-shorthand-overflow': () => {
        style.removeProperty('overflow-x');
        style.removeProperty('overflow-y');
        style.setProperty('overflow', 'scroll', 'important');
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
      'open-positioned-top-padded': () => {
        floating.setOpen(true);
        positioned.style.height = '400px';
        positioned.style.maxHeight = 'var(--overlay-available-height)';
        stopPositioning = positionOverlay({
          anchor: get('anchor'),
          floating: positioned,
          side: 'top',
          align: 'start',
          gap: 8,
          padding: 16,
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
        positioned.style.height = '';
        positioned.style.maxHeight = '';
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
    fixture.dataset.consumeEscapeRef = 'ready';
    const onInnerKey = (event: KeyboardEvent): void => {
      if (consumeInnerEscape && event.key === 'Escape') {
        event.preventDefault();
        report('innerEscapeConsumed');
      }
    };
    get('draft').addEventListener('keydown', onInnerKey);
    get('inside-manual').addEventListener('keydown', onInnerKey);

    return () => {
      fixture.removeEventListener('fixture-command', command);
      get('draft').removeEventListener('keydown', onInnerKey);
      get('inside-manual').removeEventListener('keydown', onInnerKey);
      foreignManual.removeEventListener('keydown', onForeignManualKey);
      get('trigger1').removeEventListener('click', onTrigger1Click);
      modalTrigger.removeEventListener('click', openModal);
      get('dismiss-confirm').removeEventListener('click', dismissConfirm);
      get('close-modal')?.removeEventListener('click', closeModal);
      unsubscribe();
      stopPositioning?.();
      stopClobberedPositioning?.();
      for (const node of clobberedDocNodes) {
        node.remove();
      }
      [
        manualInP1Handle,
        dialogPopoverChildHandle,
        foreignComboHandle,
        innerNestedHandle,
        outerNestedHandle,
        clobberedHandle,
        shadowHandle,
        divHandle,
        nestedFloating,
        floating,
        innerPanel,
        panel,
        passive,
        m,
        b,
        a,
        d2,
        d1,
      ].forEach((handle) => handle.dispose());
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
      <div id="div-trigger" role="button" tabIndex={0}>
        Div trigger
      </div>
      <div id="div-popover" style={overlap}>
        <button id="div-popover-action" type="button">
          Div popover action
        </button>
      </div>
      <div id="shadow-trigger-host" />
      <div id="shadow-popover" style={overlap}>
        <button id="shadow-popover-action" type="button">
          Shadow popover action
        </button>
      </div>
      <form id="clobbered-outer-form">
        <input type="hidden" name="parentElement" value="trap" />
        <input type="hidden" name="assignedSlot" value="trap" />
        <input type="hidden" name="matches" value="trap" />
        <input type="hidden" name="focus" value="trap" />
        <input type="hidden" name="shadowRoot" value="trap" />
        <button id="clobbered-trigger" type="button">
          Open clobbered
        </button>
      </form>
      <form id="clobbered-form" style={overlap}>
        <input type="hidden" name="id" value="42" />
        <input type="hidden" name="popover" value="trap" />
        <input type="hidden" name="inert" value="trap" />
        <input type="hidden" name="parentElement" value="trap" />
        <input type="hidden" name="matches" value="trap" />
        <input type="hidden" name="style" value="trap" />
        <input type="hidden" name="addEventListener" value="trap" />
        <input type="hidden" name="removeEventListener" value="trap" />
        <button id="clobbered-action" type="button">
          Clobbered action
        </button>
      </form>
      <div id="outer-nested-trigger" role="button" tabIndex={0}>
        Outer trigger
        <button id="inner-nested-trigger" type="button">
          Inner trigger
        </button>
      </div>
      <div id="outer-nested-popover" style={overlap}>
        Outer nested popover
      </div>
      <div id="inner-nested-popover" style={overlap}>
        Inner nested popover
      </div>
      <div id="foreign-auto" popover="auto">
        <input id="foreign-combo-trigger" defaultValue="query" />
      </div>
      <div id="foreign-combo-panel" style={overlap}>
        Portaled combobox panel
      </div>
      <dialog id="foreign-dialog-popover" popover="auto">
        <button id="dialog-popover-trigger" type="button">
          Inside dialog popover
        </button>
        <div id="dialog-popover-child" style={overlap}>
          <button id="dialog-popover-child-action" type="button">
            Child action
          </button>
        </div>
      </dialog>
      <div id="p1" style={overlap}>
        <button id="inside-a" type="button" autoFocus>
          Outer action
        </button>
        <div id="manual-in-p1" style={{ ...overlap, left: 260 }}>
          Manual inside p1
        </div>
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
            <button id="nested-inner-trigger" type="button">
              More choices
            </button>
            <div id="guarded-inner">
              <button id="nested-inner-action" type="button">
                Inner choice
              </button>
            </div>
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
      <div id="foreign-manual" popover="manual">
        <button id="foreign-manual-action" type="button">
          Foreign manual action
        </button>
      </div>
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
        <button
          id="anchor"
          type="button"
          style={{ position: 'absolute', left: 20, width: 80, height: 24 }}
        >
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
