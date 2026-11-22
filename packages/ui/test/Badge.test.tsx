import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { Badge, UnicaProvider, defineGlyph } from '../src/index.js';
import type { BadgeProps } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

function Check(props: ComponentPropsWithRef<'svg'>) {
  return <svg {...props} viewBox="0 0 24 24" />;
}

it('renders one passive inline label and preserves application attributes', () => {
  const ref = createRef<HTMLSpanElement>();
  const { container } = render(
    <Badge
      ref={ref}
      id="document-state"
      className="metadata"
      data-status="archived"
      data-size="app-defined"
      data-ticket={42}
      data-unica-mark-status="warning"
      data-unica-badge-size="l"
      data-unica-badge-numeric
      aria-describedby="state-details"
      style={{ '--badge-max-width': '148px' }}
      status="danger"
    >
      Release <em>v2</em> <bdi dir="ltr">99+</bdi>
    </Badge>,
  );
  const root = container.firstElementChild as HTMLSpanElement;
  expect(container.children).toHaveLength(1);
  expect(root.nodeName).toBe('SPAN');
  expect(ref.current).toBe(root);
  expect(root.id).toBe('document-state');
  expect(root.classList.contains('metadata')).toBe(true);
  expect(root.dataset).toMatchObject({
    status: 'archived',
    size: 'app-defined',
    ticket: '42',
    unicaMarkStatus: 'danger',
    unicaBadgeSize: 'm',
  });
  expect(root.hasAttribute('data-unica-badge-numeric')).toBe(false);
  expect(root.getAttribute('aria-describedby')).toBe('state-details');
  expect(root.style.getPropertyValue('--badge-max-width')).toBe('148px');
  expect(root.querySelector('[dir="auto"]')?.textContent).toBe('Release v2 99+');
  expect(root.querySelector('bdi')?.dir).toBe('ltr');
  for (const attribute of ['role', 'aria-live', 'tabindex']) {
    expect(root.hasAttribute(attribute)).toBe(false);
  }
});

it.each([0, '0', '99+'])('keeps an inline count of %s visible and compact', (count) => {
  const { container, rerender } = render(<Badge>{count}</Badge>);
  const root = container.firstElementChild;
  expect(root?.textContent).toBe(String(count));
  expect(root?.getAttribute('data-unica-badge-numeric')).toBe('');
  expect(root?.getAttribute('data-unica-mark-status')).toBe('neutral');
  rerender(<Badge dot>{count}</Badge>);
  expect(root?.hasAttribute('data-unica-badge-numeric')).toBe(false);
  expect(root?.querySelector('[aria-hidden="true"]')).toBeTruthy();
});

it.each<ReactNode>([
  undefined,
  null,
  false,
  true,
  '',
  ' \t',
  <>
    <span> </span>
    {false}
  </>,
])('omits an empty label (%s) and any leading cues', (label) => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const { container, rerender } = render(
    <Badge dot iconLeft={Check}>
      {label}
    </Badge>,
  );
  expect(container.firstChild).toBeNull();
  if (typeof label === 'string' && label.length > 0) {
    expect(warn).toHaveBeenCalledTimes(1);
  } else {
    expect(warn).not.toHaveBeenCalled();
  }
  rerender(
    <Badge asChild dot>
      <button>{label}</button>
    </Badge>,
  );
  expect(container.firstChild).toBeNull();
});

it.each([Check, defineGlyph(Check)])(
  'gives both glyph sources priority over the dot',
  (iconLeft) => {
    const { container } = render(
      <UnicaProvider iconAdapter="native">
        <Badge dot size="s" iconLeft={iconLeft}>
          99+
        </Badge>
      </UnicaProvider>,
    );
    const root = container.firstElementChild;
    expect(root?.hasAttribute('data-unica-badge-numeric')).toBe(false);
    expect(root?.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
    const glyph = root?.querySelector('svg');
    expect(glyph?.getAttribute('data-unica-icon-size')).toBe('s');
    expect(glyph?.getAttribute('aria-hidden')).toBe('true');
    expect(glyph?.getAttribute('focusable')).toBe('false');
  },
);

it('composes the native root, attributes, refs, and cancellable handlers', () => {
  const outer = createRef<HTMLButtonElement>();
  const inner = createRef<HTMLButtonElement>();
  const calls: string[] = [];
  let cancel = false;
  const { container, unmount } = render(
    <Badge
      asChild
      ref={outer}
      className="outer"
      style={{ color: 'red', '--badge-max-width': '148px' }}
      status="danger"
      size="s"
      data-status="pending"
      data-ticket={42}
      data-unica-mark-status="success"
      data-unica-badge-size="l"
      data-unica-badge-numeric
      onClick={() => calls.push('outer')}
    >
      <button
        type={undefined}
        ref={inner}
        className="inner"
        style={{ color: 'blue' }}
        data-status="archived"
        data-size="app-defined"
        data-unica-mark-status="success"
        data-unica-badge-size="l"
        data-unica-badge-numeric
        onClick={(event) => {
          calls.push('inner');
          if (cancel) {
            event.preventDefault();
          }
        }}
      >
        Details
      </button>
    </Badge>,
  );
  const button = screen.getByRole<HTMLButtonElement>('button', { name: 'Details' });
  expect([...container.children]).toEqual([button]);
  expect(outer.current).toBe(button);
  expect(inner.current).toBe(button);
  expect(button.getAttribute('type')).toBe('button');
  expect(button.className).toContain('outer inner');
  expect(button.style.color).toBe('blue');
  expect(button.style.getPropertyValue('--badge-max-width')).toBe('148px');
  expect(button.dataset).toMatchObject({
    status: 'archived',
    size: 'app-defined',
    ticket: '42',
    unicaMarkStatus: 'danger',
    unicaBadgeSize: 's',
  });
  expect(button.hasAttribute('data-unica-badge-numeric')).toBe(false);
  fireEvent.click(button);
  cancel = true;
  fireEvent.click(button);
  expect(calls).toEqual(['inner', 'outer', 'inner']);
  unmount();
  expect(outer.current).toBeNull();
  expect(inner.current).toBeNull();
});

it.each<[string, ReactNode]>([
  ['a missing child', undefined],
  ['text', 'Label'],
  ['an unsupported element', <div>Label</div>],
  [
    'a fragment',
    <>
      <a>Label</a>
    </>,
  ],
  ['multiple children', [<a key="a">A</a>, <button key="b">B</button>]],
])('diagnoses %s as an invalid asChild root', (_description, children) => {
  const props = { asChild: true, children } as BadgeProps;
  expect(() => render(<Badge {...props} />)).toThrow(
    'Badge with asChild requires exactly one native <a> or <button> child.',
  );
});
