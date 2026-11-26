import { useRef } from 'react';
import { composedContains } from '../../core/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';
import { panelMotionFlag } from '../../internal/disclosure/Panel.js';
import { activeElement, availableTrigger } from '../../internal/disclosure/focus.js';
import { captureScrollAnchor } from '../../internal/disclosure/scroll.js';
import type { ScrollAnchor } from '../../internal/disclosure/scroll.js';

interface Activation {
  readonly closed: string;
  readonly opened: string;
  readonly trigger: HTMLButtonElement;
  readonly focus: Element | null;
  readonly scroll: ScrollAnchor;
}

function holdPosition(
  activation: Activation,
  panels: ReadonlyMap<string, HTMLDivElement>,
): () => void {
  const { trigger, scroll } = activation;
  const view = trigger.ownerDocument.defaultView;
  const closing = panels.get(activation.closed);
  const opening = panels.get(activation.opened);
  let frame = 0;
  let stopped = false;
  const focus = activeElement(trigger);
  const closingHasLayout = () =>
    Boolean(closing?.isConnected && !closing.hidden && closing.getClientRects().length > 0);
  let hadClosingLayout = closingHasLayout();
  // A sudden removal (for example by Activity) can clamp before the opening panel grows.
  // Ordinary animation frames only accept the current scroll boundary.
  const clampAllowance = () =>
    hadClosingLayout && !closingHasLayout() ? (opening?.offsetHeight ?? 0) : 0;
  const unwatch = scroll.watch(stop, clampAllowance);

  function stop(): void {
    if (stopped) {
      return;
    }
    stopped = true;
    view?.cancelAnimationFrame(frame);
    unwatch();
  }

  function update(): void {
    const active = activeElement(trigger);
    if (
      stopped ||
      !trigger.isConnected ||
      active !== focus ||
      !scroll.unchanged(clampAllowance())
    ) {
      stop();
      return;
    }
    scroll.restore();

    // A zero-duration close still has a React commit pending. An Activity-hidden
    // panel can keep the same DOM node while leaving layout and cancelling motion.
    hadClosingLayout = closingHasLayout();
    if (view && (hadClosingLayout || opening?.hasAttribute(panelMotionFlag))) {
      frame = view.requestAnimationFrame(update);
    } else {
      stop();
    }
  }

  update();
  return stop;
}

export function useExclusiveActivation(
  panels: ReadonlyMap<string, HTMLDivElement>,
  selected: string | undefined,
): {
  readonly request: (
    closed: string | undefined,
    opened: string | undefined,
    trigger: HTMLButtonElement,
    propose: () => void,
  ) => void;
  readonly preferredTrigger: (value: string, panel: HTMLElement) => HTMLButtonElement | undefined;
} {
  const pending = useRef<Activation | null>(null);
  const previous = useRef(selected);
  const stopAnchor = useRef<(() => void) | null>(null);

  function isEligible(activation: Activation): boolean {
    const active = activeElement(activation.trigger);
    return (
      availableTrigger(activation.trigger) &&
      (active === activation.focus || active === activation.trigger) &&
      activation.scroll.unchanged()
    );
  }

  function request(
    closed: string | undefined,
    opened: string | undefined,
    trigger: HTMLButtonElement,
    propose: () => void,
  ): void {
    stopAnchor.current?.();
    stopAnchor.current = null;
    const activation =
      closed !== undefined && opened !== undefined && closed !== opened
        ? {
            closed,
            opened,
            trigger,
            focus: activeElement(trigger),
            scroll: captureScrollAnchor(trigger),
          }
        : null;
    pending.current = activation;

    try {
      propose();
    } finally {
      // The owner may accept in the discrete commit following the callback.
      if (activation) {
        queueMicrotask(() => {
          if (pending.current === activation) {
            pending.current = null;
          }
        });
      }
    }
  }

  function preferredTrigger(value: string, panel: HTMLElement): HTMLButtonElement | undefined {
    const activation = pending.current;
    if (
      activation?.closed === value &&
      activation.opened === selected &&
      composedContains(panel, activation.focus) &&
      isEligible(activation)
    ) {
      return activation.trigger;
    }
  }

  useIsoLayoutEffect(() => {
    if (previous.current === selected) {
      return;
    }
    const activation = pending.current;
    pending.current = null;
    stopAnchor.current?.();
    stopAnchor.current = null;
    const closed = previous.current;
    previous.current = selected;
    if (
      activation?.closed === closed &&
      activation?.opened === selected &&
      activation &&
      isEligible(activation)
    ) {
      stopAnchor.current = holdPosition(activation, panels);
    }
  }, [panels, selected]);

  useIsoLayoutEffect(
    () => () => {
      pending.current = null;
      stopAnchor.current?.();
    },
    [],
  );

  return { request, preferredTrigger };
}
