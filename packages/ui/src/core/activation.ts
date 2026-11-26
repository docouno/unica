import { getDefaultView } from './dom.js';

export function afterDispatch(event: Event, input: HTMLInputElement, callback: () => void): void {
  queueMicrotask(() => {
    if (event.eventPhase === 0) {
      callback();
    } else {
      // Trusted events may run microtasks while a native listener is still active.
      const view = getDefaultView(input.ownerDocument);
      if (view) {
        view.setTimeout(callback, 0);
      } else {
        setTimeout(callback, 0);
      }
    }
  });
}

export function completeKeydown(
  event: KeyboardEvent,
  input: HTMLInputElement,
  activate: () => void,
): void {
  const property = 'preventDefault';
  const own = Object.getOwnPropertyDescriptor(event, property);
  const preventDefault = event.preventDefault.bind(event);
  let canceled = false;
  function veto(): void {
    canceled = true;
    preventDefault();
  }
  // The library suppresses this key's native default. Track later vetoes
  // separately, including when a consumer stops propagation.
  Object.defineProperty(event, property, { value: veto, configurable: true, writable: true });
  preventDefault();
  afterDispatch(event, input, () => {
    if (event.preventDefault === veto) {
      if (own) {
        Object.defineProperty(event, property, own);
      } else {
        Reflect.deleteProperty(event, property);
      }
    }
    if (!canceled) {
      activate();
    }
  });
}
