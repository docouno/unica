import { afterEach, describe, expect, it, vi } from 'vitest';
import { cx, dataFlag } from '../src/core/cx.js';
import { resetDevWarnings, warnOnce } from '../src/core/devWarning.js';
import {
  addListenerSafe,
  composedContains,
  getComposedParentElement,
  getDocumentBody,
  getLiveView,
  isInertElement,
  removeListenerSafe,
} from '../src/core/dom.js';
import { mergeStyle } from '../src/core/mergeStyle.js';
import {
  OVERLAY_RUNTIME_KEY,
  isOverlayRuntimeLike,
  resolveOverlayRuntime,
} from '../src/core/overlay-protocol.js';

afterEach(() => {
  document.body.replaceChildren();
  Reflect.deleteProperty(document, OVERLAY_RUNTIME_KEY);
  resetDevWarnings();
});

describe('core/dom and zero-dep utilities', () => {
  it('traverses assignedSlot for slotted elements and slotted text in an open ShadowRoot', () => {
    const host = document.createElement('div');
    const shadow = host.attachShadow({ mode: 'open' });
    const wrapper = document.createElement('section');
    const slot = document.createElement('slot');
    wrapper.append(slot);
    shadow.append(wrapper);

    const slottedElement = document.createElement('span');
    const slottedText = document.createTextNode('hello');
    host.append(slottedElement, slottedText);
    document.body.append(host);

    expect(getComposedParentElement(slottedElement)).toBe(slot);
    expect(getComposedParentElement(slottedText)).toBe(slot);
    expect(getComposedParentElement(slot)).toBe(wrapper);
    expect(getComposedParentElement(wrapper)).toBe(host);
    expect(composedContains(wrapper, slottedElement)).toBe(true);
    expect(composedContains(host, slottedElement)).toBe(true);
  });

  it('returns live iframe/document views, rejects detached documents, and resists defaultView clobbering', () => {
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const childDoc = frame.contentDocument!;
    const childWin = frame.contentWindow!;
    expect(getLiveView(childDoc)).toBe(childWin);
    frame.remove();

    const detachedDoc = document.implementation.createHTMLDocument();
    expect(getLiveView(detachedDoc)).toBeNull();
    expect(getLiveView(document)).toBe(window);

    // Clobbering document.defaultView with an element must not fool getLiveView.
    const origDesc = Object.getOwnPropertyDescriptor(document, 'defaultView');
    try {
      Object.defineProperty(document, 'defaultView', {
        value: document.createElement('form'),
        configurable: true,
      });
      expect(getLiveView(document)).toBe(window);
    } finally {
      if (origDesc) {
        Object.defineProperty(document, 'defaultView', origDesc);
      } else {
        Reflect.deleteProperty(document, 'defaultView');
      }
    }
  });

  it('survives clobbered document.body and addEventListener/removeEventListener', () => {
    const origBody = Object.getOwnPropertyDescriptor(document, 'body');
    const origAdd = Object.getOwnPropertyDescriptor(document, 'addEventListener');
    const origRemove = Object.getOwnPropertyDescriptor(document, 'removeEventListener');
    const realBody = document.body;
    const listener = vi.fn();
    try {
      Object.defineProperty(document, 'body', {
        value: document.createElement('img'),
        configurable: true,
      });
      Object.defineProperty(document, 'addEventListener', {
        value: 'clobbered',
        configurable: true,
      });
      Object.defineProperty(document, 'removeEventListener', {
        value: 'clobbered',
        configurable: true,
      });

      expect(getDocumentBody(document)).toBe(realBody);
      addListenerSafe(document, 'custom-clobber-test', listener);
      document.dispatchEvent(new Event('custom-clobber-test'));
      expect(listener).toHaveBeenCalledTimes(1);
      removeListenerSafe(document, 'custom-clobber-test', listener);
      document.dispatchEvent(new Event('custom-clobber-test'));
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      if (origBody) {
        Object.defineProperty(document, 'body', origBody);
      } else {
        Reflect.deleteProperty(document, 'body');
      }
      if (origAdd) {
        Object.defineProperty(document, 'addEventListener', origAdd);
      } else {
        Reflect.deleteProperty(document, 'addEventListener');
      }
      if (origRemove) {
        Object.defineProperty(document, 'removeEventListener', origRemove);
      } else {
        Reflect.deleteProperty(document, 'removeEventListener');
      }
    }
  });

  it('checks disconnected inert ancestors and ignores fake 1-method document runtime keys', () => {
    const detachedParent = document.createElement('div');
    const detachedInput = document.createElement('input');
    detachedParent.append(detachedInput);
    expect(isInertElement(detachedInput)).toBe(false);
    detachedParent.setAttribute('inert', '');
    expect(isInertElement(detachedInput)).toBe(true);

    // Fake 1-method object on document[OVERLAY_RUNTIME_KEY] must be rejected by isOverlayRuntimeLike.
    const fakeDialog = document.createElement('dialog');
    Reflect.set(document, OVERLAY_RUNTIME_KEY, { resolveModal: () => fakeDialog });
    expect(isOverlayRuntimeLike(Reflect.get(document, OVERLAY_RUNTIME_KEY))).toBe(false);
    expect(resolveOverlayRuntime(document)).toBeUndefined();

    const liveInput = document.createElement('input');
    document.body.append(liveInput);
    expect(isInertElement(liveInput)).toBe(false);
  });

  it('provides cx, dataFlag, mergeStyle, and warnOnce/resetDevWarnings', () => {
    expect(cx('a', false, null, undefined, '', 'b')).toBe('a b');
    expect(dataFlag(true)).toBe('');
    expect(dataFlag(false)).toBeUndefined();
    expect(dataFlag(undefined)).toBeUndefined();

    expect(mergeStyle(undefined, undefined, undefined)).toBeUndefined();
    expect(
      mergeStyle(
        { color: 'blue', padding: undefined, '--badge-max-width': '120px' },
        { color: 'green', '--_owned': '1', '--removed': undefined },
        { color: 'red', margin: '4px', '--removed': 'old' },
      ),
    ).toEqual({
      color: 'green',
      margin: '4px',
      '--badge-max-width': '120px',
      '--_owned': '1',
    });

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    try {
      warnOnce('dup-key', 'First warning');
      warnOnce('dup-key', 'Duplicate warning');
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy).toHaveBeenCalledWith('First warning');

      resetDevWarnings();
      warnOnce('dup-key', 'After reset');
      expect(warnSpy).toHaveBeenCalledTimes(2);
    } finally {
      warnSpy.mockRestore();
    }
  });
});
