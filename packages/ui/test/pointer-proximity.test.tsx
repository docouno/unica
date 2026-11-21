import { cleanup, render } from '@testing-library/react';
import { Profiler } from 'react';
import type { ReactElement } from 'react';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribePointerProximity } from '../src/core/pointer-proximity.js';
import type {
  PointerPosition,
  PointerProximityObserver,
  PointerProximitySubscription,
} from '../src/core/pointer-proximity.js';
import { UnicaProvider } from '../src/core/UnicaProvider.js';

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

const fineHover = '(hover: hover) and (pointer: fine)';
const reducedMotion = '(prefers-reduced-motion: reduce)';
const forcedColors = '(forced-colors: active)';
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

function listenerTypes(calls: readonly RecordedListenerCall[], target: EventTarget): string[] {
  return calls.filter((entry) => entry.target === target).map((entry) => entry.type);
}

function replaceProperty(target: object, key: string, value: unknown): void {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  Object.defineProperty(target, key, { configurable: true, value });
  cleanups.push(() => {
    if (descriptor) {
      Object.defineProperty(target, key, descriptor);
    } else {
      Reflect.deleteProperty(target, key);
    }
  });
}

function installEnvironment(doc: Document) {
  const view = doc.defaultView;
  if (!view) {
    throw new Error('Expected a window for the pointer test');
  }
  const pending = new Map<number, FrameRequestCallback>();
  const media = new Map<string, { matches: boolean } & EventTarget>();
  let nextFrame = 0;
  const request = vi.fn((callback: FrameRequestCallback) => {
    const id = ++nextFrame;
    pending.set(id, callback);
    return id;
  });
  const cancel = vi.fn((id: number) => pending.delete(id));
  const matchMedia = vi.fn((query: string) => {
    const result = Object.assign(new view.EventTarget(), { matches: query === fineHover });
    media.set(query, result);
    return result;
  });
  replaceProperty(view, 'requestAnimationFrame', request);
  replaceProperty(view, 'cancelAnimationFrame', cancel);
  replaceProperty(view, 'matchMedia', matchMedia);
  replaceProperty(doc, 'hidden', false);

  return {
    view,
    request,
    cancel,
    matchMedia,
    pending,
    flush() {
      const batch = [...pending.values()];
      pending.clear();
      for (const callback of batch) {
        callback(0);
      }
    },
    changeMedia(query: string, matches: boolean) {
      const result = media.get(query);
      if (!result) {
        throw new Error(`Unexpected media query ${query}`);
      }
      result.matches = matches;
      result.dispatchEvent(new view.Event('change'));
    },
  };
}

function move(target: Element, x: number, y: number, pointerType = 'mouse'): void {
  const view = target.ownerDocument.defaultView;
  if (!view) {
    throw new Error('Expected a window for pointer events');
  }
  target.dispatchEvent(
    new view.PointerEvent('pointermove', { bubbles: true, clientX: x, clientY: y, pointerType }),
  );
}

function bind(
  owner: Element,
  observer: PointerProximityObserver,
  enabled?: boolean,
): PointerProximitySubscription {
  const subscription = subscribePointerProximity(owner, observer, enabled);
  cleanups.push(subscription.unsubscribe);
  return subscription;
}

function BoundButton({
  id,
  observer,
}: {
  id: string;
  observer: PointerProximityObserver;
}): ReactElement {
  return (
    <button
      ref={(node) => (node ? subscribePointerProximity(node, observer).unsubscribe : undefined)}
    >
      {id}
    </button>
  );
}

afterEach(() => {
  cleanup();
  for (const dispose of cleanups.splice(0).reverse()) {
    dispose();
  }
  document.body.replaceChildren();
});

describe('PointerProximity', () => {
  it('shares one frame across React roots and completes the batch of reads before painting', () => {
    const env = installEnvironment(document);
    const commits = vi.fn();
    const delivery: string[] = [];
    const makeObserver = (name: string) => ({
      measure: vi.fn(({ x, y }: PointerPosition) => {
        delivery.push(`read ${name} ${x},${y}`);
        return () => delivery.push(`write ${name}`);
      }),
      reset: vi.fn(),
    });
    const first = makeObserver('first');
    const second = makeObserver('second');
    const a = render(
      <Profiler id="first" onRender={commits}>
        <BoundButton id="first" observer={first} />
      </Profiler>,
    );
    const b = render(
      <UnicaProvider>
        <UnicaProvider>
          <Profiler id="second" onRender={commits}>
            <BoundButton id="second" observer={second} />
          </Profiler>
        </UnicaProvider>
      </UnicaProvider>,
    );

    expect(listenerTypes(added, document).filter((type) => type === 'pointermove')).toHaveLength(1);
    expect(env.matchMedia).toHaveBeenCalledTimes(3);
    expect(env.request).not.toHaveBeenCalled();
    move(a.container, 10, 20);
    move(b.container, 11, 32);
    expect(env.request).toHaveBeenCalledTimes(1);
    expect(env.pending.size).toBe(1);
    env.flush();
    expect(delivery).toEqual([
      'read first 11,32',
      'read second 11,32',
      'write first',
      'write second',
    ]);
    expect(commits).toHaveBeenCalledTimes(2);
    expect(env.pending.size).toBe(0);

    a.unmount();
    expect(first.reset).toHaveBeenCalledTimes(1);
    expect(listenerTypes(removed, document).filter((type) => type === 'pointermove')).toHaveLength(
      0,
    );
    move(b.container, 20, 40);
    env.flush();
    expect(first.measure).toHaveBeenCalledTimes(1);
    expect(second.measure).toHaveBeenCalledTimes(2);

    move(b.container, 30, 60);
    b.unmount();
    expect(env.cancel).toHaveBeenCalledTimes(1);
    expect(listenerTypes(removed, document).filter((type) => type === 'pointermove')).toHaveLength(
      1,
    );
    move(document.body, 40, 80);
    env.flush();
    expect(second.measure).toHaveBeenCalledTimes(2);
    expect(second.reset).toHaveBeenCalledTimes(1);

    render(<BoundButton id="remounted" observer={first} />);
    move(document.body, 4, 8);
    env.flush();
    expect(first.measure).toHaveBeenCalledTimes(2);
    expect(first.measure).toHaveBeenLastCalledWith({ x: 4, y: 8 });
  });

  it('samples only for nonzero demand and recalculates from a still pointer on geometry changes', () => {
    const env = installEnvironment(document);
    const button = document.createElement('button');
    document.body.append(button);
    const geometry = vi.spyOn(button, 'getBoundingClientRect');
    const subscription = bind(
      button,
      {
        measure: ({ x }) => {
          const right = button.getBoundingClientRect().right;
          return () => button.style.setProperty('--offset', `${x - right}px`);
        },
        reset: () => {
          button.style.removeProperty('--offset');
        },
      },
      false,
    );

    move(button, 32, 24);
    button.dispatchEvent(new Event('scroll'));
    expect(env.request).not.toHaveBeenCalled();
    expect(geometry).not.toHaveBeenCalled();

    subscription.setEnabled(true);
    button.dispatchEvent(new Event('scroll'));
    env.view.dispatchEvent(new Event('resize'));
    expect(env.pending.size).toBe(1);
    env.flush();
    expect(button.style.getPropertyValue('--offset')).toBe('32px');

    geometry.mockReturnValue(new DOMRect(10, 0, 8, 10));
    button.dispatchEvent(new Event('scroll'));
    env.flush();
    expect(button.style.getPropertyValue('--offset')).toBe('14px');
    geometry.mockReturnValue(new DOMRect(0, 0, 4, 10));
    env.view.dispatchEvent(new Event('resize'));
    env.flush();
    expect(button.style.getPropertyValue('--offset')).toBe('28px');

    subscription.setEnabled(false);
    subscription.refresh();
    expect(button.style.getPropertyValue('--offset')).toBe('');
    expect(env.pending.size).toBe(0);
    move(button, 22, 15);
    subscription.setEnabled(true);
    env.flush();
    expect(button.style.getPropertyValue('--offset')).toBe('18px');
    expect(geometry).toHaveBeenCalledTimes(4);
  });

  it('clears on touch, leave, cancel, blur, and hide without replaying stale positions', () => {
    const env = installEnvironment(document);
    const observer = { measure: vi.fn(), reset: vi.fn() };
    const subscription = bind(document.body, observer);
    const stops = [
      () => move(document.body, 9, 8, 'touch'),
      () => document.dispatchEvent(new Event('pointerleave')),
      () => document.body.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true })),
      () => env.view.dispatchEvent(new Event('blur')),
      () => {
        replaceProperty(document, 'hidden', true);
        document.dispatchEvent(new Event('visibilitychange'));
        move(document.body, 4, 5);
        replaceProperty(document, 'hidden', false);
        document.dispatchEvent(new Event('visibilitychange'));
      },
    ];
    for (const [index, stop] of stops.entries()) {
      move(document.body, 1, 2);
      env.flush();
      stop();
      expect(observer.reset).toHaveBeenCalledTimes(index + 1);
      subscription.refresh();
      env.flush();
      expect(observer.measure).toHaveBeenCalledTimes(index + 1);
    }
  });

  it('discards the parent position on iframe entry even without pointerout or pointerleave', () => {
    const env = installEnvironment(document);
    const frame = document.createElement('iframe');
    document.body.append(frame);
    const observer = { measure: vi.fn(), reset: vi.fn() };
    const subscription = bind(document.body, observer);

    move(document.body, 1, 2);
    env.flush();
    move(document.body, 3, 4);
    expect(env.pending.size).toBe(1);

    frame.dispatchEvent(new PointerEvent('pointerover', { bubbles: true }));
    expect(observer.reset).toHaveBeenCalledTimes(1);
    expect(env.cancel).toHaveBeenCalledTimes(1);
    move(frame, 5, 6);
    subscription.refresh();
    expect(env.pending.size).toBe(0);
    expect(observer.measure).toHaveBeenCalledExactlyOnceWith({ x: 1, y: 2 });

    move(document.body, 7, 8);
    env.flush();
    expect(observer.measure).toHaveBeenCalledTimes(2);
    expect(observer.measure).toHaveBeenLastCalledWith({ x: 7, y: 8 });
  });

  it.each([
    [fineHover, false],
    [reducedMotion, true],
    [forcedColors, true],
  ])('suppresses material response while %s has the disabling value', (query, disabled) => {
    const env = installEnvironment(document);
    const observer = { measure: vi.fn(), reset: vi.fn() };
    bind(document.body, observer);
    move(document.body, 1, 2);
    env.flush();
    expect(observer.measure).toHaveBeenCalledTimes(1);

    move(document.body, 3, 4);
    env.changeMedia(query, disabled);
    expect(observer.reset).toHaveBeenCalledTimes(1);
    expect(env.cancel).toHaveBeenCalledTimes(1);
    move(document.body, 5, 6);
    env.changeMedia(query, !disabled);
    expect(env.pending.size).toBe(0);
    env.flush();
    expect(observer.measure).toHaveBeenCalledTimes(1);

    move(document.body, 7, 8);
    env.flush();
    expect(observer.measure).toHaveBeenCalledTimes(2);
    expect(observer.measure).toHaveBeenLastCalledWith({ x: 7, y: 8 });
  });

  it('isolates document coordinates and rebinds an adopted target only after old teardown', () => {
    const parent = installEnvironment(document);
    const frame = document.createElement('iframe');
    const target = document.createElement('input');
    document.body.append(frame, target);
    const childDoc = frame.contentDocument;
    if (!childDoc) {
      throw new Error('Expected a connected iframe document');
    }
    const child = installEnvironment(childDoc);
    const oldObserver = { measure: vi.fn(), reset: vi.fn() };
    const newObserver = { measure: vi.fn(), reset: vi.fn() };
    const oldSubscription = bind(target, oldObserver);
    move(target, 10, 20);
    expect(parent.pending.size).toBe(1);
    expect(child.pending.size).toBe(0);

    oldSubscription.unsubscribe();
    oldSubscription.unsubscribe();
    childDoc.body.append(childDoc.adoptNode(target));
    bind(target, newObserver);
    move(target, 30, 40);
    parent.flush();
    child.flush();
    expect(parent.cancel).toHaveBeenCalledTimes(1);
    expect(oldObserver.measure).not.toHaveBeenCalled();
    expect(newObserver.measure).toHaveBeenCalledExactlyOnceWith({ x: 30, y: 40 });
  });

  it('does no document work without a browsing context', () => {
    const detached = document.implementation.createHTMLDocument();
    const observer = { measure: vi.fn(), reset: vi.fn() };
    const subscription = bind(detached.body, observer);
    subscription.refresh();
    subscription.setEnabled(false);
    subscription.setEnabled(true);
    subscription.unsubscribe();
    expect(listenerTypes(added, detached)).toHaveLength(0);
    expect(observer.measure).not.toHaveBeenCalled();
    expect(observer.reset).not.toHaveBeenCalled();
  });

  it('isolates throwing measure, write, and reset callbacks via reportError without blocking siblings', () => {
    const env = installEnvironment(document);
    const reported: unknown[] = [];
    replaceProperty(env.view, 'reportError', (error: unknown) => {
      reported.push(error);
    });

    const healthyWrite = vi.fn();
    const healthyReset = vi.fn();
    const brokenMeasure = new Error('measure failed');
    const brokenWrite = new Error('write failed');
    const brokenReset = new Error('reset failed');

    const elA = document.createElement('button');
    const elB = document.createElement('button');
    const elC = document.createElement('button');
    document.body.append(elA, elB, elC);

    bind(elA, {
      measure: () => {
        throw brokenMeasure;
      },
      reset: () => {
        throw brokenReset;
      },
    });
    bind(elB, {
      measure: () => () => {
        throw brokenWrite;
      },
      reset: vi.fn(),
    });
    bind(elC, {
      measure: () => healthyWrite,
      reset: healthyReset,
    });

    move(document.body, 15, 25);
    env.flush();
    expect(healthyWrite).toHaveBeenCalledTimes(1);
    expect(reported).toEqual([brokenMeasure, brokenWrite]);

    document.dispatchEvent(new Event('pointerleave'));
    expect(healthyReset).toHaveBeenCalledTimes(1);
    expect(reported).toEqual([brokenMeasure, brokenWrite, brokenReset]);
  });
});
