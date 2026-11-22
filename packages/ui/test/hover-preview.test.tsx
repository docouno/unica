import { cleanup, render } from '@testing-library/react';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HoverCardContent, HoverCardTrigger, Tooltip } from '../src/index.js';
import * as dom from '../src/core/dom.js';
import { PreviewController } from '../src/core/hover-preview/controller.js';
import type { PreviewOptions } from '../src/core/hover-preview/controller.js';

// Browser suites exercise actual admission. A synchronous carrier here makes the
// boundary of every timer and warmup window independently observable.
vi.mock('../src/core/overlay/runtime.js', () => ({
  subscribeToModalChanges: () => () => {},
  registerOverlay: ({ element }: { element: HTMLElement }) => ({
    isOpen: () => element.hasAttribute('data-test-open'),
    setTrigger: () => {},
    update: () => {},
    setOpen: (open: boolean) => element.toggleAttribute('data-test-open', open),
    dispose: () => element.removeAttribute('data-test-open'),
  }),
}));

vi.mock('../src/core/overlay/positioning.js', () => ({
  positionOverlay: ({ preview }: { preview?: { onPositioned?: () => void } }) => {
    preview?.onPositioned?.();
    return () => {};
  },
}));

vi.mock('../src/core/dom.js', async (original) => {
  const actual = await original<typeof dom>();
  return {
    ...actual,
    matchesSafe: (element: Element, selector: string) =>
      selector === ':popover-open'
        ? element.hasAttribute('data-test-open')
        : actual.matchesSafe(element, selector),
  };
});

const controllers: PreviewController[] = [];

function createPreview(
  family: 'tooltip' | 'hover-card' = 'tooltip',
  overrides: Partial<PreviewOptions> = {},
) {
  const anchor = document.createElement(family === 'tooltip' ? 'button' : 'a');
  if (anchor.localName === 'a') {
    anchor.setAttribute('href', '#destination');
  }
  const carrier = document.createElement('span');
  vi.spyOn(anchor, 'getClientRects').mockReturnValue({ length: 1 } as DOMRectList);
  document.body.append(anchor, carrier);
  const controller = new PreviewController(family, carrier, document, dom.getLiveView(document)!);
  controllers.push(controller);
  const notify = vi.fn<NonNullable<PreviewOptions['notify']>>();
  const options: PreviewOptions = {
    anchor,
    avoid: null,
    domain: null,
    side: 'top',
    align: 'center',
    padding: 16,
    external: false,
    disabled: false,
    controlled: false,
    open: false,
    admission: { blocked: false },
    isMounted: () => true,
    write: () => {},
    notify,
    ...overrides,
  };
  controller.update(options);
  return {
    controller,
    options,
    notify,
    visible: () => carrier.hasAttribute('data-test-open'),
  };
}

function mouse(type: string): PointerEvent {
  return new PointerEvent(type, { pointerType: 'mouse' });
}

describe('hover preview intent', () => {
  const originalPopover = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'showPopover');

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setTimeout', 'clearTimeout'] });
    const view = dom.getLiveView(document)!;
    const setTimeout = globalThis.setTimeout;
    const clearTimeout = globalThis.clearTimeout;
    vi.spyOn(view.performance, 'now').mockImplementation(() => Date.now());
    vi.spyOn(view, 'setTimeout').mockImplementation((fn, delay) => setTimeout(fn, delay));
    vi.spyOn(view, 'clearTimeout').mockImplementation((id) => clearTimeout(id));
    Object.defineProperty(HTMLElement.prototype, 'showPopover', {
      configurable: true,
      value: () => {},
    });
  });

  afterEach(() => {
    for (const controller of controllers.splice(0)) {
      controller.dispose();
    }
    document.body.replaceChildren();
    if (originalPopover) {
      Object.defineProperty(HTMLElement.prototype, 'showPopover', originalPopover);
    } else {
      Reflect.deleteProperty(HTMLElement.prototype, 'showPopover');
    }
    vi.useRealTimers();
  });

  it('opens at 600ms and closes at 150ms, with a cancellable pointer departure', () => {
    const { controller, visible, notify } = createPreview();
    controller.enterTrigger(mouse('pointerenter'));
    vi.advanceTimersByTime(599);
    expect(visible()).toBe(false);
    vi.advanceTimersByTime(1);
    expect(visible()).toBe(true);
    controller.leaveTrigger(mouse('pointerleave'));
    vi.advanceTimersByTime(149);
    expect(visible()).toBe(true);
    controller.enterCarrier(mouse('pointerenter'));
    vi.advanceTimersByTime(1000);
    expect(visible()).toBe(true);
    controller.leaveCarrier(mouse('pointerleave'));
    vi.advanceTimersByTime(150);
    expect(visible()).toBe(false);
    expect(notify.mock.calls.map(([open, details]) => [open, details.reason])).toEqual([
      [true, 'hover'],
      [false, 'leave'],
    ]);
  });

  it('warms its own family and provider until the 300ms boundary', () => {
    const names = {};
    const first = createPreview('tooltip', { domain: names, delay: 300 });
    const second = createPreview('tooltip', { domain: names, delay: 300 });
    const otherGroup = createPreview('tooltip', { domain: {}, delay: 300 });
    const card = createPreview('hover-card', { domain: names, delay: 300 });
    first.controller.enterTrigger(mouse('pointerenter'));
    vi.advanceTimersByTime(299);
    expect(first.visible()).toBe(false);
    vi.advanceTimersByTime(1);
    second.controller.enterTrigger(mouse('pointerenter'));
    expect(second.visible()).toBe(true);
    expect(first.visible()).toBe(false);
    second.controller.activate(new MouseEvent('click'));
    vi.advanceTimersByTime(299);
    first.controller.enterTrigger(mouse('pointerenter'));
    expect(first.visible()).toBe(true);
    first.controller.activate(new MouseEvent('click'));
    vi.advanceTimersByTime(300);
    second.controller.enterTrigger(mouse('pointerenter'));
    expect(second.visible()).toBe(false);
    vi.advanceTimersByTime(300);
    expect(second.visible()).toBe(true);
    otherGroup.controller.enterTrigger(mouse('pointerenter'));
    expect(otherGroup.visible()).toBe(false);
    card.controller.enterTrigger(mouse('pointerenter'));
    expect(card.visible()).toBe(false);
    vi.advanceTimersByTime(300);
    expect(card.visible()).toBe(true);
    expect(otherGroup.notify).not.toHaveBeenCalled();
  });

  it('keeps the current owner when a controlled request is refused and accepts a fresh commit', async () => {
    const first = createPreview('tooltip', { delay: 0, controlled: true });
    const second = createPreview('hover-card', { open: true });
    first.controller.enterTrigger(mouse('pointerenter'));
    expect(first.notify).toHaveBeenCalledExactlyOnceWith(
      true,
      expect.objectContaining({ reason: 'hover' }),
    );
    expect(second.visible()).toBe(true);
    first.controller.update({ ...first.options, open: true });
    await Promise.resolve();
    expect(first.visible()).toBe(true);
    expect(second.notify).toHaveBeenCalledExactlyOnceWith(false, { reason: 'replacement' });
    const third = createPreview('tooltip', { open: true });
    first.controller.update({ ...first.options, open: true });
    expect(first.visible()).toBe(false);
    expect(third.visible()).toBe(true);
    first.controller.update({ ...first.options, open: false });
    first.options.admission.blocked = false;
    first.controller.update({ ...first.options, open: true });
    await Promise.resolve();
    expect(first.visible()).toBe(true);
    expect(third.visible()).toBe(false);
  });

  it('checks computed availability for the visible preview and pending hover until they end', () => {
    const view = dom.getLiveView(document)!;
    const requestFrame = vi
      .spyOn(view, 'requestAnimationFrame')
      .mockReturnValueOnce(41)
      .mockReturnValueOnce(42)
      .mockReturnValueOnce(43);
    const cancelFrame = vi.spyOn(view, 'cancelAnimationFrame');
    const first = createPreview('tooltip', { open: true });
    const second = createPreview('hover-card', { delay: 600 });
    expect(requestFrame).toHaveBeenCalledTimes(1);

    second.controller.enterTrigger(mouse('pointerenter'));
    vi.advanceTimersByTime(599);
    expect(requestFrame).toHaveBeenCalledTimes(2);

    vi.advanceTimersByTime(1);
    expect(first.visible()).toBe(false);
    expect(cancelFrame.mock.calls).toEqual([[42], [41]]);
    expect(requestFrame).toHaveBeenCalledTimes(3);

    second.controller.dispose();
    expect(cancelFrame.mock.calls).toEqual([[42], [41], [43]]);
    expect(second.visible()).toBe(false);
  });
});

describe('preview composition', () => {
  afterEach(cleanup);

  it('keeps the original trigger and releases callback refs once per Strict Mode attachment', () => {
    const releases = vi.fn<() => void>();
    const attach = vi.fn(() => () => {
      releases();
    });
    const view = render(
      <StrictMode>
        <Tooltip label="Guide" describe>
          <button type="button" ref={attach}>
            Help
          </button>
        </Tooltip>
      </StrictMode>,
    );
    const original = view.getByRole('button', { name: 'Help' });
    const attachmentCount = attach.mock.calls.length;
    view.rerender(
      <StrictMode>
        <Tooltip label=" ">
          <button type="button" ref={attach}>
            Help
          </button>
        </Tooltip>
      </StrictMode>,
    );
    expect(view.getByRole('button', { name: 'Help' })).toBe(original);
    expect(view.container.querySelector('[popover]')).toBeNull();
    expect(attach).toHaveBeenCalledTimes(attachmentCount);
    view.unmount();
    expect(releases).toHaveBeenCalledTimes(attachmentCount);
  });

  it('diagnoses missing roots and malformed slotted triggers', () => {
    expect(() => render(<HoverCardTrigger href="#guide">Guide</HoverCardTrigger>)).toThrow(
      /inside HoverCard/,
    );
    expect(() => render(<HoverCardContent>Guide</HoverCardContent>)).toThrow(/inside HoverCard/);
    expect(() =>
      render(
        <Tooltip label="Help">
          <>
            <button />
          </>
        </Tooltip>,
      ),
    ).toThrow(/exactly one React element/);
  });
});
