import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { markKeyboardNavigation, subscribeFocusOrigin } from '../src/core/focus-origin.js';
import type { FocusOrigin } from '../src/core/focus-origin.js';

interface RecordedListenerCall {
  readonly target: EventTarget;
  readonly type: string;
}

type ListenerFn = (
  this: EventTarget,
  type: string,
  listener: EventListenerOrEventListenerObject | null,
  options?: boolean | AddEventListenerOptions,
) => void;

const cleanups: (() => void)[] = [];
const added: RecordedListenerCall[] = [];
const removed: RecordedListenerCall[] = [];
let originalAdd: ListenerFn;
let originalRemove: ListenerFn;

// Wrap EventTarget.prototype once before the first call warms core/dom.ts's descriptor cache.
beforeAll(() => {
  const rawAdd: unknown = Reflect.get(EventTarget.prototype, 'addEventListener');
  const rawRemove: unknown = Reflect.get(EventTarget.prototype, 'removeEventListener');
  originalAdd = rawAdd as ListenerFn;
  originalRemove = rawRemove as ListenerFn;
  EventTarget.prototype.addEventListener = function addEventListener(type, listener, options) {
    added.push({ target: this, type });
    Reflect.apply(originalAdd, this, [type, listener, options]);
  };
  EventTarget.prototype.removeEventListener = function removeEventListener(
    type,
    listener,
    options,
  ) {
    removed.push({ target: this, type });
    Reflect.apply(originalRemove, this, [type, listener, options]);
  };
});

afterAll(() => {
  Reflect.set(EventTarget.prototype, 'addEventListener', originalAdd);
  Reflect.set(EventTarget.prototype, 'removeEventListener', originalRemove);
});

beforeEach(() => {
  added.length = 0;
  removed.length = 0;
});

function isWindowTarget(target: EventTarget): boolean {
  return (
    target === window ||
    target === document.defaultView ||
    ('document' in target && (target as Window).document === document)
  );
}

function listenerTypes(calls: readonly RecordedListenerCall[], target: EventTarget): string[] {
  const match = isWindowTarget(target)
    ? (entry: RecordedListenerCall) => isWindowTarget(entry.target)
    : (entry: RecordedListenerCall) => entry.target === target;
  return calls.filter(match).map((entry) => entry.type);
}

function bind(owner: HTMLElement): { detach: () => void; report: ReturnType<typeof vi.fn> } {
  const report = vi.fn((origin: FocusOrigin | null) => {
    if (origin) {
      owner.dataset.focusOrigin = origin;
    } else {
      delete owner.dataset.focusOrigin;
    }
  });
  const detach = subscribeFocusOrigin(owner, report);
  cleanups.push(detach);
  return { detach, report };
}

function key(target: Element, value: string, modifiers: KeyboardEventInit = {}): void {
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key: value, bubbles: true, composed: true, ...modifiers }),
  );
}

function pointer(target: Element): void {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true, composed: true }));
}

function frameDocument(): Document {
  const frame = document.createElement('iframe');
  document.body.append(frame);
  if (!frame.contentDocument) {
    throw new Error('Expected a connected iframe document');
  }
  return frame.contentDocument;
}

afterEach(() => {
  for (const detach of cleanups.splice(0)) {
    detach();
  }
  document.body.replaceChildren();
});

describe('FocusOrigin', () => {
  it('keeps pointer editing quiet and uses keyboard origin for Tab into that same field', () => {
    const scope = document.createElement('label');
    const field = document.createElement('textarea');
    const next = document.createElement('button');
    scope.append(field);
    document.body.append(scope, next);
    const { report } = bind(scope);

    pointer(field);
    field.focus();
    key(field, 'a');
    key(field, 'End');
    key(field, 'ArrowLeft', { shiftKey: true });
    key(field, 'Shift');
    key(field, 'End', { isComposing: true });
    key(field, 'x', { ctrlKey: true });

    expect(scope.dataset.focusOrigin).toBe('pointer');
    expect(report.mock.calls).toEqual([['pointer']]);

    next.focus();
    expect(scope.dataset.focusOrigin).toBeUndefined();
    key(next, 'Tab', { shiftKey: true });
    field.focus();
    expect(scope.dataset.focusOrigin).toBe('keyboard');
    expect(report.mock.calls).toEqual([['pointer'], [null], ['keyboard']]);
  });

  it('keeps keyboard origin when an End handler moves focus and clicks a radio', () => {
    const first = document.createElement('input');
    const last = document.createElement('input');
    first.type = last.type = 'radio';
    first.name = last.name = 'choice';
    document.body.append(first, last);
    bind(first);
    bind(last);
    first.addEventListener('keydown', (event) => {
      if (event.key === 'End') {
        last.focus();
        last.click();
      }
    });

    pointer(first);
    first.focus();
    expect(first.dataset.focusOrigin).toBe('pointer');
    key(first, 'End');
    expect(document.activeElement).toBe(last);
    expect(last.checked).toBe(true);
    expect(last.dataset.focusOrigin).toBe('keyboard');
  });

  it('lets an editable composite mark option navigation while keeping DOM focus in its editor', () => {
    const field = document.createElement('input');
    field.setAttribute('role', 'combobox');
    document.body.append(field);
    bind(field);

    pointer(field);
    field.focus();
    key(field, 'ArrowDown');
    expect(field.dataset.focusOrigin).toBe('pointer');

    field.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') {
        markKeyboardNavigation(field);
      }
    });
    key(field, 'ArrowDown');
    expect(field.dataset.focusOrigin).toBe('keyboard');
    expect(document.activeElement).toBe(field);
  });

  it('forgets pointer origin after window blur while preserving a new pointerdown before window focus', () => {
    const field = document.createElement('textarea');
    document.body.append(field);
    bind(field);

    pointer(field);
    field.focus();
    expect(field.dataset.focusOrigin).toBe('pointer');

    field.blur();
    window.dispatchEvent(new Event('blur'));
    window.dispatchEvent(new Event('focus'));
    field.focus();
    expect(field.dataset.focusOrigin).toBe('unknown');

    field.blur();
    window.dispatchEvent(new Event('blur'));
    pointer(field);
    window.dispatchEvent(new Event('focus'));
    field.focus();
    expect(field.dataset.focusOrigin).toBe('pointer');
  });

  it('keeps the actual focus when a previous owner emits a late focusout', () => {
    const from = document.createElement('input');
    const redirected = document.createElement('input');
    document.body.append(from, redirected);
    const { report } = bind(redirected);
    from.focus();
    key(from, 'Tab');
    redirected.focus();
    from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: null }));

    expect(document.activeElement).toBe(redirected);
    expect(report.mock.calls).toEqual([['keyboard']]);
  });

  it('keeps one continuous report while focus moves within the same owner', async () => {
    const owner = document.createElement('div');
    const first = document.createElement('input');
    const next = document.createElement('input');
    owner.append(first, next);
    document.body.append(owner);
    const { report } = bind(owner);
    key(first, 'Tab');
    first.focus();
    next.focus();
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(report.mock.calls).toEqual([['keyboard']]);
  });

  it('mounts another binding during blur without interrupting the focused owner', () => {
    const owner = document.createElement('div');
    const first = document.createElement('input');
    const next = document.createElement('input');
    owner.append(first, next);
    document.body.append(owner);
    const { report } = bind(owner);
    key(first, 'Tab');
    first.focus();
    first.addEventListener('blur', () => {
      const added = document.createElement('input');
      document.body.append(added);
      bind(added);
    });

    next.focus();

    expect(document.activeElement).toBe(next);
    expect(report.mock.calls).toEqual([['keyboard']]);
  });

  it('never reports focus for a proposed destination that disappears during focusout', async () => {
    const from = document.createElement('input');
    const wrapper = document.createElement('label');
    const proposed = document.createElement('input');
    wrapper.append(proposed);
    document.body.append(from, wrapper);
    const { report } = bind(wrapper);
    from.focus();
    key(from, 'Tab');
    from.addEventListener('focusout', () => proposed.remove(), { once: true });
    from.dispatchEvent(new FocusEvent('focusout', { bubbles: true, relatedTarget: proposed }));
    from.blur();
    await Promise.resolve();

    expect(document.activeElement).toBe(document.body);
    expect(report).not.toHaveBeenCalled();
  });

  it('releases the binding and document listeners when the initial notification throws', () => {
    const owner = document.createElement('input');
    document.body.append(owner);
    owner.focus();
    const failed = vi.fn(() => {
      throw new Error('attachment failed');
    });
    expect(() => subscribeFocusOrigin(owner, failed)).toThrow('attachment failed');
    expect(listenerTypes(removed, document).filter((type) => type === 'focusin')).toHaveLength(1);

    // A pointerdown while unsubscribed must not be recorded by a leaked tracker.
    pointer(owner);
    const { report } = bind(owner);
    expect(report.mock.calls).toEqual([['unknown']]);
    pointer(owner);
    expect(report.mock.calls).toEqual([['unknown'], ['pointer']]);
    expect(failed).toHaveBeenCalledTimes(1);
  });

  it('shares capture listeners and resets the last modality only after the final detach', () => {
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    const one = bind(field);
    const two = bind(field);
    expect(one.report.mock.calls).toEqual([['unknown']]);
    expect(two.report.mock.calls).toEqual([['unknown']]);

    const view = document.defaultView!;
    const originEvents = ['pointerdown', 'keydown', 'focusin', 'focusout'];
    expect(listenerTypes(added, document).filter((type) => originEvents.includes(type))).toEqual(
      originEvents,
    );
    expect(listenerTypes(added, view).filter((type) => type === 'blur')).toHaveLength(1);
    one.detach();
    one.detach();
    pointer(field);
    expect(one.report.mock.calls).toEqual([['unknown']]);
    expect(two.report.mock.calls).toEqual([['unknown'], ['pointer']]);
    expect(
      listenerTypes(removed, document).filter((type) => originEvents.includes(type)),
    ).toHaveLength(0);

    two.detach();
    expect(
      listenerTypes(removed, document).filter((type) => originEvents.includes(type)),
    ).toHaveLength(4);
    expect(listenerTypes(removed, view).filter((type) => type === 'blur')).toHaveLength(1);
    expect(bind(field).report.mock.calls).toEqual([['unknown']]);
  });

  it('isolates iframe modality and supports detaching then rebinding an adopted element', () => {
    const child = frameDocument();
    const mainInput = document.createElement('input');
    const frameInput = child.createElement('input');
    child.body.append(frameInput);
    document.body.append(mainInput);
    const oldBinding = bind(mainInput);
    bind(frameInput);

    mainInput.focus();
    pointer(mainInput);
    key(frameInput, 'Tab');
    expect(mainInput.dataset.focusOrigin).toBe('pointer');
    frameInput.focus();
    expect(frameInput.dataset.focusOrigin).toBe('keyboard');

    oldBinding.detach();
    const beforeAdopt = oldBinding.report.mock.calls.length;
    child.body.append(child.adoptNode(mainInput));
    bind(mainInput);
    pointer(mainInput);
    mainInput.focus();
    key(mainInput, 'End');
    expect(mainInput.dataset.focusOrigin).toBe('pointer');
    key(mainInput, 'Tab');
    expect(mainInput.dataset.focusOrigin).toBe('keyboard');
    expect(oldBinding.report).toHaveBeenCalledTimes(beforeAdopt);
  });

  it('does no document work when its owner has no browsing context', () => {
    const detached = document.implementation.createHTMLDocument();
    const field = detached.createElement('input');
    const { detach, report } = bind(field);
    markKeyboardNavigation(field);
    detach();
    expect(listenerTypes(added, detached)).toHaveLength(0);
    expect(report).not.toHaveBeenCalled();
  });

  it('is immune to HTMLFormElement DOM clobbering on parentElement, ownerDocument, nodeType, localName, isContentEditable, and contains', () => {
    const form = document.createElement('form');
    form.tabIndex = -1;
    for (const name of [
      'parentElement',
      'ownerDocument',
      'nodeType',
      'contains',
      'localName',
      'isContentEditable',
    ]) {
      const clobber = document.createElement('input');
      clobber.name = name;
      Element.prototype.append.call(form, clobber);
    }
    const target = document.createElement('button');
    target.type = 'button';
    Element.prototype.append.call(form, target);
    document.body.append(form);

    const { report } = bind(form);
    pointer(target);
    target.focus();
    expect(form.dataset.focusOrigin).toBe('pointer');

    markKeyboardNavigation(target);
    expect(form.dataset.focusOrigin).toBe('keyboard');
    expect(report.mock.calls).toEqual([['pointer'], ['keyboard']]);

    // Non-editable clobbered <form> with <input name="isContentEditable"> must still flip to keyboard on ArrowDown.
    pointer(form);
    form.focus();
    expect(form.dataset.focusOrigin).toBe('pointer');
    key(form, 'ArrowDown');
    expect(form.dataset.focusOrigin).toBe('keyboard');

    // Editable clobbered <form> exercises prototype-safe nodeType/localName/isContentEditable during keydown.
    Object.defineProperty(form, 'isContentEditable', { value: true, configurable: true });
    pointer(form);
    form.focus();
    key(form, 'a');
    expect(form.dataset.focusOrigin).toBe('pointer');
  });

  it('tracks focus origin and markKeyboardNavigation inside open Shadow DOM', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const shadowInput = document.createElement('input');
    const shadowButton = document.createElement('button');
    shadowButton.type = 'button';
    shadow.append(shadowInput, shadowButton);
    document.body.append(host);

    const hostBinding = bind(host);
    shadowInput.focus();
    // Subscribing after shadowInput is already focused must report initial focus via composed ancestor walk.
    const inputBinding = bind(shadowInput);
    expect(hostBinding.report.mock.calls).toEqual([['unknown']]);
    expect(inputBinding.report.mock.calls).toEqual([['unknown']]);

    pointer(shadowInput);
    expect(shadowInput.dataset.focusOrigin).toBe('pointer');
    expect(host.dataset.focusOrigin).toBe('pointer');

    markKeyboardNavigation(shadowInput);
    expect(shadowInput.dataset.focusOrigin).toBe('keyboard');
    expect(host.dataset.focusOrigin).toBe('keyboard');

    pointer(shadowButton);
    shadowButton.focus();
    expect(shadowInput.dataset.focusOrigin).toBeUndefined();
    expect(host.dataset.focusOrigin).toBe('pointer');

    inputBinding.detach();
    expect(listenerTypes(removed, shadow)).toEqual(['focusin', 'focusout']);
  });

  it('ignores non-KeyboardEvent keydown, Safari IME keyCode 229, and isolates throwing subscribers', () => {
    const first = document.createElement('input');
    const second = document.createElement('button');
    second.type = 'button';
    document.body.append(first, second);
    bind(first);

    pointer(first);
    first.focus();
    // Plain Event('keydown') (e.g. Chrome autofill with key === undefined) must not throw or change origin.
    expect(() => first.dispatchEvent(new Event('keydown', { bubbles: true }))).not.toThrow();
    expect(first.dataset.focusOrigin).toBe('pointer');

    // Safari IME Enter fires isComposing: false with keyCode === 229; must keep pointer origin.
    const safariIme = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(safariIme, 'keyCode', { value: 229 });
    first.dispatchEvent(safariIme);
    expect(first.dataset.focusOrigin).toBe('pointer');

    // A throwing subscriber during sync() must not block healthy sibling subscribers.
    const healthy = bind(second);
    const throwingDetach = subscribeFocusOrigin(first, (origin) => {
      if (origin === null) {
        throw new Error('broken focus listener');
      }
    });
    cleanups.push(throwingDetach);

    const reportSpy = vi.fn();
    vi.stubGlobal('reportError', reportSpy);
    try {
      second.focus();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(healthy.report).toHaveBeenCalledWith('pointer');
    expect(reportSpy).toHaveBeenCalledTimes(1);
  });
});
