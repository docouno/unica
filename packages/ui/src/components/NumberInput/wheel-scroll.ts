import { getComposedParentElement, getDeepActiveElement, getDefaultView } from '../../core/dom.js';

function scrollNearest(input: HTMLInputElement, event: WheelEvent, view: Window): void {
  const page = input.ownerDocument.scrollingElement;
  for (
    let owner = getComposedParentElement(input);
    owner;
    owner = getComposedParentElement(owner)
  ) {
    const style = view.getComputedStyle(owner);
    const overflow = style.overflowY;
    const scrollable =
      owner === page
        ? overflow !== 'hidden' && overflow !== 'clip'
        : overflow === 'auto' || overflow === 'scroll';
    if (!scrollable || owner.clientHeight >= owner.scrollHeight) {
      continue;
    }
    const unit =
      event.deltaMode === event.DOM_DELTA_PAGE
        ? owner.clientHeight
        : Number.parseFloat(style.lineHeight) || Number.parseFloat(style.fontSize) * 1.2;
    const before = owner.scrollTop;
    owner.scrollBy({ top: event.deltaY * unit, behavior: 'instant' });
    if (owner.scrollTop !== before || style.overscrollBehaviorY !== 'auto') {
      return;
    }
  }
}

/**
 * Firefox 125–129 on Windows and Linux can spin a focused number input on a
 * line/page wheel with hidden native controls. See Mozilla bug 1741469.
 */
export function preserveWheelScroll(input: HTMLInputElement): (() => void) | undefined {
  const doc = input.ownerDocument;
  const candidate = getDefaultView(doc);
  if (
    !candidate ||
    !/\b(?:Windows|X11)\b.*\bFirefox\/12[5-9]\./.test(candidate.navigator.userAgent)
  ) {
    return;
  }
  const view = candidate;

  let pending: WheelEvent | undefined;

  function remember(event: WheelEvent): void {
    pending = undefined;
    if (
      !event.isTrusted ||
      event.defaultPrevented ||
      event.deltaMode === event.DOM_DELTA_PIXEL ||
      event.deltaY === 0 ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !event.composedPath().includes(input)
    ) {
      return;
    }
    pending = event;
  }

  function scroll(event: Event): void {
    const wheel = pending;
    const legacy = event as Event & { readonly axis?: number; readonly VERTICAL_AXIS?: number };
    if (
      !wheel ||
      !legacy.isTrusted ||
      !legacy.cancelable ||
      legacy.defaultPrevented ||
      wheel.defaultPrevented ||
      legacy.timeStamp !== wheel.timeStamp ||
      legacy.axis === undefined ||
      legacy.axis !== legacy.VERTICAL_AXIS ||
      !legacy.composedPath().includes(input)
    ) {
      return;
    }
    pending = undefined;
    if (!input.readOnly && !input.matches(':disabled') && getDeepActiveElement(doc) === input) {
      // Gecko emits this event after wheel listeners finish and before its
      // default action. Cancel it to replace only the number's spin action.
      // See Mozilla bugs 719320 and 1741469.
      legacy.preventDefault();
      scrollNearest(input, wheel, view);
    }
  }

  function attach(): void {
    view.addEventListener('wheel', remember, { capture: true, passive: true });
    view.addEventListener('MozMousePixelScroll', scroll, { capture: true, passive: false });
  }

  function detach(): void {
    pending = undefined;
    view.removeEventListener('wheel', remember, true);
    view.removeEventListener('MozMousePixelScroll', scroll, true);
  }

  input.addEventListener('focus', attach);
  input.addEventListener('blur', detach);
  if (getDeepActiveElement(doc) === input) {
    attach();
  }
  return () => {
    input.removeEventListener('focus', attach);
    input.removeEventListener('blur', detach);
    detach();
  };
}
