import { useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getLiveView } from '../../core/dom.js';
import { registerOverlay } from '../../core/overlay/runtime.js';
import type { OverlayHandle } from '../../core/overlay/runtime.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { prepareDialogFocus } from './initial-focus.js';
import type { DialogLabels } from './labels.js';

export type DialogPhase = 'closed' | 'preparing' | 'open';

export interface DialogActivation {
  readonly invoker: HTMLElement;
  readonly pointer: string | undefined;
}

interface NativeDialogOptions {
  readonly dialog: HTMLDialogElement | null;
  readonly surface: HTMLDivElement | null;
  readonly labels: DialogLabels;
  readonly requested: boolean;
  readonly parentOpen: boolean | undefined;
  readonly parentClosing: boolean | undefined;
  readonly readOpen: () => boolean;
  readonly requestClose: () => void;
  readonly takeActivation: () => DialogActivation | null;
  readonly initialFocus: RefObject<HTMLElement | null> | undefined;
  readonly returnFocus: RefObject<HTMLElement | null> | undefined;
}

interface Opening {
  readonly handle: OverlayHandle;
  started: boolean;
  lost: boolean;
  pointer: string | undefined;
}

export function useNativeDialog(options: NativeDialogOptions): DialogPhase {
  const { dialog, surface, requested, parentOpen, parentClosing, takeActivation } = options;
  const [phase, setPhase] = useState<DialogPhase>('closed');
  const opening = useRef<Opening | null>(null);
  const latest = useRef(options);
  useIsoLayoutEffect(() => {
    latest.current = options;
  });

  useIsoLayoutEffect(() => {
    if (!dialog) {
      return;
    }
    const handle = registerOverlay({
      kind: 'modal',
      element: dialog,
      prepareInitialFocus() {
        const { surface, labels, initialFocus } = latest.current;
        if (!surface) {
          return;
        }
        const pointer = opening.current?.pointer;
        const view = getLiveView(dialog.ownerDocument);
        const touch =
          pointer === 'touch' ||
          (pointer === undefined && view?.matchMedia?.('(pointer: coarse)').matches === true);
        return prepareDialogFocus(dialog, surface, labels.title(), initialFocus?.current, touch);
      },
      getReturnFocus: () => latest.current.returnFocus?.current ?? null,
      onOpenChange(open, reason) {
        const current = opening.current;
        if (open || current?.handle !== handle || !latest.current.readOpen()) {
          return;
        }
        if (reason === 'lost' || reason === 'native') {
          current.lost = true;
          setPhase('closed');
        }
        latest.current.requestClose();
      },
    });
    opening.current = { handle, started: false, lost: false, pointer: undefined };
    return () => {
      opening.current = null;
      handle.dispose();
    };
  }, [dialog]);

  useIsoLayoutEffect(() => {
    const current = opening.current;
    if (!current) {
      return;
    }
    if (!requested || parentClosing) {
      if (current.started || current.lost) {
        current.started = false;
        current.lost = false;
        current.handle.setOpen(false, { returnFocus: !parentClosing });
        current.handle.setTrigger(null);
      }
      if (phase !== 'closed') {
        setPhase('closed');
      }
      return;
    }
    // The child's portal exists inside the parent's dialog. Wait until the
    // parent's native admission before attempting to show its child.
    if (parentOpen === false || current.lost) {
      return;
    }
    if (phase === 'closed') {
      setPhase('preparing');
      return;
    }
    if (!surface || current.started) {
      return;
    }
    current.started = true;
    const activation = takeActivation();
    current.pointer = activation?.pointer;
    current.handle.setTrigger(activation?.invoker ?? null);
    current.handle.setOpen(true);
    if (current.handle.isOpen()) {
      setPhase('open');
    } else {
      // A reentrant open can be deferred by the runtime until native autofocus
      // or a pending loss report from the previous opening completes.
      queueMicrotask(() => {
        if (opening.current === current && current.handle.isOpen()) {
          setPhase('open');
        }
      });
    }
  });

  return phase;
}
