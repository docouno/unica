import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { Indicator } from '../src/index.js';
import type { IndicatorProps } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

type NumericOptions = Pick<IndicatorProps, 'count' | 'max' | 'showZero' | 'visible'>;

const numericCases: readonly [string, NumericOptions, string | null][] = [
  ['omitted', {}, null],
  ['undefined', { count: undefined }, null],
  ['null', { count: null }, null],
  ['zero', { count: 0 }, null],
  ['shown zero', { count: 0, showZero: true }, '0'],
  ['one digit', { count: 9 }, '9'],
  ['two digits', { count: 10 }, '10'],
  ['at the cap', { count: 99 }, '99'],
  ['above the cap', { count: 100 }, '99+'],
  ['custom cap', { count: 12, max: 9 }, '9+'],
  ['largest safe count', { count: Number.MAX_SAFE_INTEGER }, '99+'],
  ['negative', { count: -1 }, null],
  ['fractional', { count: 3.5 }, null],
  ['unsafe', { count: Number.MAX_SAFE_INTEGER + 1 }, null],
  ['NaN', { count: NaN }, null],
  ['infinite', { count: Infinity }, null],
  ['zero cap with shown zero', { count: 0, max: 0, showZero: true }, null],
  ['negative cap', { count: 3, max: -1 }, null],
  ['fractional cap', { count: 3, max: 1.5 }, null],
  ['unsafe cap', { count: 3, max: Number.MAX_SAFE_INTEGER + 1 }, null],
  ['NaN cap', { count: 3, max: NaN }, null],
  ['infinite cap', { count: 3, max: Infinity }, null],
  ['hidden count', { count: 3, visible: false }, null],
];

it.each(numericCases)('formats a %s count', (_case, props, expected) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { container } = render(
    <Indicator {...props}>
      <button type="button">Notifications</button>
    </Indicator>,
  );

  const marker = container.querySelector('[data-unica-indicator-mode="count"]');
  expect(marker?.textContent ?? null).toBe(expected);
  expect(container.querySelector('[data-unica-indicator-mode="dot"]')).toBeNull();
  expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  const invalidCount =
    typeof props.count === 'number' && (!Number.isSafeInteger(props.count) || props.count < 0);
  const invalidMax =
    props.max !== undefined && (!Number.isSafeInteger(props.max) || props.max <= 0);
  expect(warn).toHaveBeenCalledTimes(Number(invalidCount) + Number(invalidMax));
  if (marker) {
    expect(marker.getAttribute('aria-hidden')).toBe('true');
    expect(marker.getAttribute('data-unica-indicator-border')).toBe('');
    expect(marker.querySelector('bdi')?.dir).toBe('ltr');
  }
});

it('lets a dot take precedence over untyped numeric data and honors visible in dot mode', () => {
  const props = { dot: true, count: NaN, max: 0 } as unknown as IndicatorProps;
  const { container, rerender } = render(
    <Indicator {...props} withBorder={false}>
      <button type="button">Activity</button>
    </Indicator>,
  );
  const marker = container.querySelector('[data-unica-indicator-mode="dot"]');
  expect(marker?.textContent).toBe('');
  expect(marker?.getAttribute('aria-hidden')).toBe('true');
  expect(marker?.hasAttribute('data-unica-indicator-border')).toBe(false);

  rerender(
    <Indicator dot visible={false}>
      <button type="button">Activity</button>
    </Indicator>,
  );
  expect(container.querySelector('[data-unica-indicator-mode]')).toBeNull();
  expect(screen.getByRole('button', { name: 'Activity' })).toBeTruthy();
});

it('keeps refs, root attributes, native events, and the same host through count changes', () => {
  const rootRef = createRef<HTMLSpanElement>();
  const hostRef = createRef<HTMLButtonElement>();
  const calls: string[] = [];
  function view(count: number) {
    return (
      <Indicator
        ref={rootRef}
        className="local"
        id="activity"
        dir="rtl"
        data-source="mail"
        style={{ marginInlineEnd: 4 }}
        count={count}
        onClick={() => calls.push('root')}
      >
        <button
          ref={hostRef}
          type="button"
          aria-label={`Notifications, ${count} unread`}
          onClick={() => calls.push('host')}
        >
          Notifications
        </button>
      </Indicator>
    );
  }

  const { rerender } = render(view(105));
  const root = rootRef.current;
  const host = screen.getByRole('button', { name: 'Notifications, 105 unread' });
  expect(root).toBeInstanceOf(HTMLSpanElement);
  expect(root?.classList.contains('local')).toBe(true);
  expect(root?.id).toBe('activity');
  expect(root?.dir).toBe('rtl');
  expect(root?.dataset.source).toBe('mail');
  expect(root?.style.marginInlineEnd).toBe('4px');
  expect(root?.firstElementChild).toBe(host);
  expect(hostRef.current).toBe(host);

  expect(root?.getAttribute('data-unica-indicator-position')).toBe('top-end');
  expect(root?.getAttribute('data-unica-indicator-status')).toBe('accent');
  expect(root?.getAttribute('data-unica-indicator-size')).toBe('m');
  expect(root?.getAttribute('data-unica-indicator-overlap')).toBe('rectangular');
  expect(root?.getAttribute('data-unica-indicator-width')).toBe('auto');

  host.focus();
  fireEvent.click(host);
  expect(calls).toEqual(['host', 'root']);
  rerender(view(0));
  expect(root?.querySelector('[data-unica-indicator-mode]')).toBeNull();
  rerender(view(3));
  expect(rootRef.current).toBe(root);
  expect(hostRef.current).toBe(host);
  expect(document.activeElement).toBe(host);
  expect(root?.querySelector('[data-unica-indicator-mode]')?.textContent).toBe('3');
  expect(host.getAttribute('aria-label')).toBe('Notifications, 3 unread');
});

it.each([true, false])(
  'hydrates server HTML with native hidden=%s and keeps the host',
  async (hidden) => {
    const element = (
      <Indicator count={105} hidden={hidden}>
        <button type="button" aria-label="Notifications, 105 unread">
          Notifications
        </button>
      </Indicator>
    );
    const container = document.createElement('div');
    container.innerHTML = renderToString(element);
    const span = container.firstElementChild;
    const button = span?.firstElementChild;
    expect(span?.hasAttribute('hidden')).toBe(hidden);
    expect(span?.querySelector('bdi')?.textContent).toBe('99+');
    const onRecoverableError = vi.fn();
    const root = hydrateRoot(container, element, { onRecoverableError });

    try {
      await act(async () => {});
      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(container.firstElementChild).toBe(span);
      expect(span?.firstElementChild).toBe(button);
      expect(span?.hasAttribute('hidden')).toBe(hidden);
    } finally {
      act(() => root.unmount());
    }
  },
);
