import { useInsertionEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { composedContains, getDeepActiveElement } from '../../core/dom.js';
import { retainFocusOrigin } from '../../core/focus-origin.js';
import { focusElement } from '../../core/overlay/dom.js';
import { anchorIntersectsViewport, positionOverlay } from '../../core/overlay/positioning.js';
import { registerOverlay } from '../../core/overlay/runtime.js';
import { useControllableState } from '../../core/useControllableState.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { isVisibleTrigger, trackTabExit } from '../Popover/interaction.js';

type OpenInput = 'direct' | 'touch';

interface Options {
  readonly trigger: RefObject<HTMLButtonElement | null>;
  readonly panel: RefObject<HTMLDivElement | null>;
  readonly open?: boolean | undefined;
  readonly defaultOpen?: boolean | undefined;
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  readonly disabled: boolean;
  readonly onClose: () => void;
  readonly onFocusContent: (input: OpenInput) => void;
}

interface Opening {
  readonly panel: HTMLDivElement;
  readonly anchor: HTMLButtonElement;
  close: (returnFocus?: boolean) => void;
  stop: () => void;
}

interface SelectPopover {
  readonly open: boolean;
  readonly modality: RefObject<OpenInput>;
  readonly toggle: (input: OpenInput, pointerClick: boolean) => void;
  readonly close: () => void;
  readonly openFromKeyboard: () => void;
  readonly beginPointer: () => void;
}

function measureContent(panel: HTMLElement): number {
  const rail = panel.querySelector<HTMLElement>('[role="listbox"]');
  const height = panel.getBoundingClientRect().height;
  if (!rail) {
    return height;
  }
  const view = panel.ownerDocument.defaultView;
  const rem = Number.parseFloat(
    view?.getComputedStyle(panel.ownerDocument.documentElement).fontSize ?? '16',
  );
  return height + Math.max(0, Math.min(rail.scrollHeight, 22 * rem) - rail.clientHeight);
}

export function useSelectPopover(options: Options): SelectPopover {
  const { trigger, panel, open, defaultOpen = false, onOpenChange, disabled } = options;
  const [requested, propose] = useControllableState({
    value: open,
    defaultValue: defaultOpen,
    onChange: onOpenChange,
  });
  const [opened, setOpened] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const opening = useRef<Opening | null>(null);
  const blocked = useRef(false);
  const suppressClick = useRef(false);
  const modality = useRef<OpenInput>('direct');
  const pendingInput = useRef<{ readonly input: OpenInput } | null>(null);
  const committed = useRef({ options, propose });
  useInsertionEffect(() => {
    committed.current = { options, propose };
  });

  useIsoLayoutEffect(() => () => opening.current?.stop(), []);

  useIsoLayoutEffect(() => {
    const node = panel.current;
    const anchor = trigger.current;
    const existing = opening.current;
    if (existing && (existing.panel !== node || existing.anchor !== anchor)) {
      existing.close(false);
      committed.current.propose(false);
      return;
    }
    if (!requested) {
      blocked.current = false;
      existing?.close();
      return;
    }
    if (blocked.current) {
      return;
    }

    function reject(): void {
      blocked.current = true;
      existing?.close(false);
      committed.current.propose(false);
    }
    if (
      disabled ||
      !node ||
      !anchor ||
      !isVisibleTrigger(anchor) ||
      !anchorIntersectsViewport(anchor)
    ) {
      reject();
      return;
    }
    if (existing) {
      return;
    }

    const { ownerDocument: document } = node;
    const releaseOrigin = retainFocusOrigin(document);
    let active = true;
    const cleanups: (() => void)[] = [];
    const stop = (): void => {
      if (active) {
        active = false;
        opening.current = null;
        for (const cleanup of cleanups) {
          cleanup();
        }
        releaseOrigin();
        node.removeAttribute('data-unica-select-positioned');
        handle.dispose();
      }
    };
    const finish = (): void => {
      setOpened(false);
      committed.current.options.onClose();
    };
    const close = (returnFocus?: boolean): void => {
      handle.setOpen(false, { returnFocus });
      stop();
      finish();
    };
    const dismiss = (returnFocus: boolean): void => {
      blocked.current = true;
      close(returnFocus);
      committed.current.propose(false);
    };
    const handle = registerOverlay({
      kind: 'auto',
      activation: 'component',
      element: node,
      trigger: anchor,
      onDismissStart: (reason, target) => {
        if (reason === 'native' && composedContains(anchor, target)) {
          suppressClick.current = true;
        }
        blocked.current = true;
      },
      onOpenChange: (isOpen) => {
        if (active && !isOpen) {
          blocked.current = true;
          stop();
          finish();
          committed.current.propose(false);
        }
      },
    });
    opening.current = { panel: node, anchor, close, stop };
    node.setAttribute('autofocus', '');
    handle.setOpen(true);
    node.removeAttribute('autofocus');
    if (!node.matches(':popover-open')) {
      stop();
      reject();
      return;
    }

    modality.current = pendingInput.current?.input ?? 'direct';
    pendingInput.current = null;
    setOpened(true);
    // The popover is next to its invoker in the DOM, so sequential navigation
    // naturally moves to the trigger before it and the next field after it.
    cleanups.push(
      trackTabExit(
        node,
        (target) => composedContains(node, target),
        () => dismiss(false),
      ),
    );
    if (getDeepActiveElement(document) !== node) {
      focusElement(node, document);
    }
    if (!active) {
      return;
    }
    committed.current.options.onFocusContent(modality.current);
    if (!active) {
      return;
    }
    cleanups.push(
      positionOverlay({
        anchor,
        floating: node,
        side: 'bottom',
        align: 'start',
        gap: 8,
        padding: 16,
        popover: {
          measureBlockSize: measureContent,
          preserveSide: true,
          isAnchorAvailable: isVisibleTrigger,
          onAnchorLost: () => dismiss(false),
          onPositioned: () => node.setAttribute('data-unica-select-positioned', ''),
        },
      }),
    );
  }, [requested, disabled, trigger, panel, attempt]);

  function requestOpen(input: OpenInput): void {
    if (!opening.current && !disabled) {
      const request = { input };
      pendingInput.current = request;
      try {
        if (blocked.current) {
          blocked.current = false;
          setAttempt((count) => count + 1);
        }
        propose(true);
      } finally {
        queueMicrotask(() => {
          if (pendingInput.current === request) {
            pendingInput.current = null;
          }
        });
      }
    }
  }

  return {
    open: opened && !disabled,
    modality,
    toggle(input, pointerClick) {
      if (pointerClick && suppressClick.current) {
        suppressClick.current = false;
        return;
      }
      if (opening.current) {
        propose(false);
      } else {
        requestOpen(input);
      }
    },
    close() {
      if (requested && !blocked.current) {
        propose(false);
      }
    },
    openFromKeyboard: () => requestOpen('direct'),
    beginPointer() {
      suppressClick.current = false;
    },
  };
}
