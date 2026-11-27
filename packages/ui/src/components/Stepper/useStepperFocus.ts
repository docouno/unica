import { Component, useRef } from 'react';
import type { FocusEvent, MouseEvent, ReactElement, RefObject } from 'react';
import { getDeepActiveElement, getRootNodeSafe, matchesSafe } from '../../core/dom.js';
import { focusElement } from '../../core/overlay/dom.js';
import { useIsoLayoutEffect } from '../../core/useIsoLayoutEffect.js';

const disclosure = '.unica-stepper-disclosure';
const step = '.unica-stepper-step';
const action = '.unica-stepper-entry:enabled';

interface FocusOwner {
  readonly target: HTMLElement;
  readonly row: HTMLLIElement | null;
  pointerRequest: boolean;
  blurredWhileAvailable: boolean;
}

interface StepperFocusNodes {
  readonly root: RefObject<HTMLDivElement | null>;
  readonly compact: RefObject<HTMLDivElement | null>;
  readonly summary: RefObject<HTMLDivElement | null>;
  readonly list: RefObject<HTMLOListElement | null>;
}

interface StepperFocus {
  readonly captureBlurredOwner: () => FocusOwner | null;
  readonly releaseBlurredOwner: (snapshot: FocusOwner | null) => void;
  readonly onFocus: (event: FocusEvent<HTMLDivElement>) => void;
  readonly onBlur: (event: FocusEvent<HTMLDivElement>) => void;
  readonly recordActivation: (event: MouseEvent<HTMLButtonElement>) => void;
  readonly focusDisclosureForToggle: (button: HTMLButtonElement) => void;
}

interface StepperFocusBoundaryProps extends Pick<
  StepperFocus,
  'captureBlurredOwner' | 'releaseBlurredOwner'
> {
  readonly children: ReactElement;
}

/** Native focusout cannot distinguish an explicit blur from a React DOM mutation. */
export class StepperFocusBoundary extends Component<StepperFocusBoundaryProps> {
  override getSnapshotBeforeUpdate(): FocusOwner | null {
    return this.props.captureBlurredOwner();
  }

  override componentDidUpdate(
    _previousProps: StepperFocusBoundaryProps,
    _previousState: unknown,
    snapshot: FocusOwner | null,
  ): void {
    this.props.releaseBlurredOwner(snapshot);
  }

  override render(): ReactElement {
    return this.props.children;
  }
}

function focusOwner(target: HTMLElement): FocusOwner {
  return {
    target,
    row: target.closest<HTMLLIElement>(step),
    pointerRequest: false,
    blurredWhileAvailable: false,
  };
}

function isAvailableFocusTarget(target: HTMLElement): boolean {
  return target.getClientRects().length > 0 && !matchesSafe(target, ':disabled');
}

function activeInDocument(node: HTMLElement): Element | null {
  const doc = node.ownerDocument;
  return getDeepActiveElement(doc, getRootNodeSafe(node)) ?? getDeepActiveElement(doc);
}

/** Reconcile only focus that belonged to this map before its DOM or CSS projection changed. */
export function useStepperFocus(
  { root, compact, summary, list }: StepperFocusNodes,
  hasSteps: boolean,
  setExpanded: (expanded: boolean) => void,
): StepperFocus {
  const owner = useRef<FocusOwner | null>(null);
  const reconcileCommitted = useRef<(() => void) | null>(null);

  function reconcile(): void {
    const focused = owner.current;
    const map = root.current;
    const fullList = list.current;
    const compactView = compact.current;
    if (!focused || !map || !fullList || !compactView) {
      return;
    }

    const doc = map.ownerDocument;
    const active = activeInDocument(map);
    if (
      !map.getClientRects().length ||
      (active && active !== focused.target && active !== doc.body && active !== doc.documentElement)
    ) {
      owner.current = null;
      return;
    }

    const narrow = compactView.getClientRects().length > 0;
    const disclosureButton = compactView.querySelector<HTMLButtonElement>(disclosure);
    const disclosureAvailable =
      disclosureButton !== null && !matchesSafe(disclosureButton, ':disabled');
    const listVisible = fullList.getClientRects().length > 0;
    const listOwnsFocus =
      focused.target === fullList || (focused.row && fullList.contains(focused.row));
    if (
      listOwnsFocus &&
      narrow &&
      disclosureAvailable &&
      disclosureButton.getAttribute('aria-expanded') === 'false' &&
      (active === focused.target || !listVisible || !focused.target.isConnected)
    ) {
      // CSS keeps a focused list visible between the container query and this commit.
      setExpanded(true);
      if (!listVisible) {
        return;
      }
    }

    const stillAvailable = isAvailableFocusTarget(focused.target);
    if (active === focused.target && stillAvailable) {
      return;
    }

    owner.current = null;
    if (focused.pointerRequest && focused.row?.getAttribute('aria-current') === 'step') {
      return;
    }
    if (!listVisible) {
      focusElement(summary.current, doc);
      return;
    }
    if (focused.row && fullList.contains(focused.row)) {
      focusElement(stillAvailable ? focused.target : focused.row, doc);
      return;
    }
    if (narrow && disclosureAvailable && compactView.contains(focused.target)) {
      focusElement(disclosureButton, doc);
      return;
    }
    const fallback =
      fullList.querySelector('[aria-current="step"]') ?? fullList.querySelector(action) ?? fullList;
    focusElement(fallback, doc);
  }

  useIsoLayoutEffect(() => {
    reconcileCommitted.current = reconcile;
    reconcile();
  });
  useIsoLayoutEffect(() => {
    const map = root.current;
    const compactView = compact.current;
    if (!hasSteps || !map || !compactView) {
      return;
    }

    const mapElement = map;
    // Hydration can attach to a focused server-rendered button without a new focus event.
    const focused = mapElement.querySelector<HTMLElement>(':focus');
    if (focused && !owner.current) {
      owner.current = focusOwner(focused);
    }

    const doc = mapElement.ownerDocument;
    const view = doc.defaultView;
    const observer = view?.ResizeObserver
      ? new view.ResizeObserver(() => reconcileCommitted.current?.())
      : undefined;
    observer?.observe(compactView);
    function clear(): void {
      owner.current = null;
    }
    function releaseOnOutsideFocus(event: Event): void {
      if (!event.composedPath().includes(mapElement)) {
        clear();
      }
    }
    doc.addEventListener('focusin', releaseOnOutsideFocus, true);
    view?.addEventListener('blur', clear);
    return () => {
      observer?.disconnect();
      doc.removeEventListener('focusin', releaseOnOutsideFocus, true);
      view?.removeEventListener('blur', clear);
      clear();
    };
  }, [compact, hasSteps, root]);

  return {
    captureBlurredOwner() {
      const previous = owner.current;
      if (
        previous &&
        activeInDocument(previous.target) !== previous.target &&
        (previous.blurredWhileAvailable || isAvailableFocusTarget(previous.target))
      ) {
        return previous;
      }
      return null;
    },
    releaseBlurredOwner(snapshot) {
      if (snapshot && owner.current === snapshot) {
        owner.current = null;
      }
    },
    onFocus(event) {
      owner.current = focusOwner(event.target);
    },
    onBlur(event) {
      const previous = owner.current;
      if (!previous || event.target !== previous.target) {
        return;
      }
      if (event.relatedTarget) {
        owner.current = null;
        return;
      }
      // Record availability before a caller can change the container in the same task.
      previous.blurredWhileAvailable = isAvailableFocusTarget(previous.target);
      queueMicrotask(() => {
        if (owner.current !== previous) {
          return;
        }
        const target = previous.target;
        if (previous.blurredWhileAvailable) {
          if (activeInDocument(target) !== target) {
            owner.current = null;
          }
        } else {
          reconcileCommitted.current?.();
        }
      });
    },
    recordActivation(event) {
      const focused = owner.current;
      if (focused?.target === event.currentTarget) {
        focused.pointerRequest = event.detail !== 0;
      }
    },
    focusDisclosureForToggle(button) {
      const active = activeInDocument(button);
      if (active && (list.current?.contains(active) || summary.current?.contains(active))) {
        focusElement(button, button.ownerDocument);
      }
    },
  };
}
