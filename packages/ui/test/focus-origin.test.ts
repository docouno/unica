import { afterEach, describe, expect, it, vi } from 'vitest';
import { markKeyboardNavigation, subscribeFocusOrigin } from '../src/core/focus-origin.js';
import type { FocusOrigin } from '../src/core/focus-origin.js';

const cleanups: (() => void)[] = [];

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
  target.dispatchEvent(new KeyboardEvent('keydown', { key: value, bubbles: true, ...modifiers }));
}

function pointer(target: Element): void {
  target.dispatchEvent(new Event('pointerdown', { bubbles: true }));
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

  it('shares capture listeners and resets the last modality only after the final detach', () => {
    const add = vi.spyOn(document, 'addEventListener');
    const remove = vi.spyOn(document, 'removeEventListener');
    const addWindow = vi.spyOn(window, 'addEventListener');
    const removeWindow = vi.spyOn(window, 'removeEventListener');
    const field = document.createElement('input');
    document.body.append(field);
    field.focus();
    const one = bind(field);
    const two = bind(field);
    expect(one.report.mock.calls).toEqual([['unknown']]);
    expect(two.report.mock.calls).toEqual([['unknown']]);

    const originEvents = ['pointerdown', 'keydown', 'focusin', 'focusout'];
    expect(
      add.mock.calls.filter(([type]) => originEvents.includes(type)).map(([type]) => type),
    ).toEqual(originEvents);
    expect(addWindow.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(1);
    one.detach();
    one.detach();
    pointer(field);
    expect(one.report.mock.calls).toEqual([['unknown']]);
    expect(two.report.mock.calls).toEqual([['unknown'], ['pointer']]);
    expect(remove.mock.calls.filter(([type]) => originEvents.includes(type))).toHaveLength(0);

    two.detach();
    expect(remove.mock.calls.filter(([type]) => originEvents.includes(type))).toHaveLength(4);
    expect(removeWindow.mock.calls.filter(([type]) => type === 'blur')).toHaveLength(1);
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
    const add = vi.spyOn(detached, 'addEventListener');
    const { detach, report } = bind(field);
    markKeyboardNavigation(field);
    detach();
    expect(add).not.toHaveBeenCalled();
    expect(report).not.toHaveBeenCalled();
  });
});
