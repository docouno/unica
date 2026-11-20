import { act, cleanup, render, screen } from '@testing-library/react';
import { createElement, createRef, useId } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Icon, IconProvider, UnicaProvider, defineGlyph } from '../src/index.js';
import type { IconAdapter, IconProps } from '../src/index.js';

type SvgProps = ComponentPropsWithRef<'svg'>;

function Mark({ children, ...props }: SvgProps) {
  const id = useId();
  return (
    <svg {...props} viewBox="0 0 32 16" data-shape="mark">
      {children}
      <clipPath id={id}>
        <rect width="32" height="16" />
      </clipPath>
      <path clipPath={`url(#${id})`} d="M0 0h32v16H0z" />
    </svg>
  );
}

const fixedMark = defineGlyph(Mark);

it('resolves the nearest adapter and keeps an immutable definition on its own adapter', () => {
  const makeAdapter =
    (label: string): IconAdapter =>
    (source, { inputProps, svgProps, usage }) => {
      const props = { ...inputProps, ...svgProps, 'data-adapter': label, 'data-usage': usage };
      return createElement(source, props);
    };
  const first = vi.fn(makeAdapter('first'));
  const second = vi.fn(makeAdapter('second'));
  const fixedAdapter = vi.fn(makeAdapter('fixed'));
  const fixed = defineGlyph(Mark, fixedAdapter);
  const ref = createRef<SVGSVGElement>();

  render(
    <>
      <IconProvider adapter={first}>
        <Icon icon={Mark} data-testid="first" />
        <IconProvider adapter={second}>
          <Icon icon={Mark} usage="slot" data-testid="second" ref={ref} />
          <Icon icon={fixed} data-testid="fixed" />
          <Icon icon={fixedMark} data-testid="native" />
        </IconProvider>
      </IconProvider>
      <IconProvider adapter={first}>
        <Icon icon={Mark} data-testid="sibling" />
      </IconProvider>
    </>,
  );

  expect(first.mock.calls.map(([source, ctx]) => [source, ctx.usage])).toEqual([
    [Mark, 'standalone'],
    [Mark, 'standalone'],
  ]);
  expect(second.mock.calls.map(([source, ctx]) => [source, ctx.usage])).toEqual([[Mark, 'slot']]);
  expect(fixedAdapter).toHaveBeenCalledTimes(1);
  expect(Object.isFrozen(fixed)).toBe(true);
  expect(fixed.source).toBe(Mark);
  expect(ref.current).toBe(screen.getByTestId('second'));
  expect(screen.getByTestId('fixed').getAttribute('data-adapter')).toBe('fixed');
  expect(screen.getByTestId('native').getAttribute('data-adapter')).toBeNull();
});

it('omits undefined vendor options when the source checks their presence', () => {
  function LegendMark(props: SvgProps & { legend?: string }) {
    return (
      <svg>
        <title>{'legend' in props ? props.legend.toUpperCase() : 'Default'}</title>
      </svg>
    );
  }
  expect(renderToString(<Icon icon={defineGlyph(LegendMark)} legend={undefined} />)).toContain(
    'Default',
  );
});

it('passes optional source props that share a prefix with event handlers', () => {
  function Project({ oneTone, ...svg }: SvgProps & { oneTone?: boolean }) {
    return <svg {...svg} data-tone={oneTone ? 'single' : 'multiple'} />;
  }
  const project = defineGlyph(Project);
  const inspect = vi.fn<IconAdapter>((source, { inputProps, svgProps }) =>
    createElement(source, { ...inputProps, ...svgProps }),
  );
  render(
    <>
      <Icon icon={project} oneTone data-testid="native-extra" />
      <IconProvider adapter={inspect}>
        <Icon icon={Project} oneTone data-testid="adapted-extra" />
      </IconProvider>
    </>,
  );
  for (const id of ['native-extra', 'adapted-extra']) {
    expect(screen.getByTestId(id).getAttribute('data-tone')).toBe('single');
  }
  expect(inspect.mock.calls[0]?.[1].inputProps).toEqual({ oneTone: true });
});

it('honors standalone defaults, explicit dimensions and owner slot sizing independently', () => {
  render(
    <UnicaProvider theme={{ preset: 'soft-dark', defaults: { Icon: { size: 'm' } } }}>
      <Icon icon={fixedMark} data-testid="theme" />
      <UnicaProvider overrides={{ Icon: { size: 's' } }}>
        <Icon icon={fixedMark} data-testid="override" />
        <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
          <Icon icon={fixedMark} data-testid="nearest" />
          <Icon icon={fixedMark} data-testid="instance" size="inherit" />
          <Icon icon={fixedMark} data-testid="slot" usage="slot" />
          <Icon icon={fixedMark} data-testid="sized-slot" usage="slot" size="m" />
        </UnicaProvider>
      </UnicaProvider>
    </UnicaProvider>,
  );
  expect(
    ['theme', 'override', 'nearest', 'instance', 'slot', 'sized-slot'].map((id) =>
      screen.getByTestId(id).getAttribute('width'),
    ),
  ).toEqual([
    'var(--size-m-icon)',
    'var(--size-s-icon)',
    'var(--size-l-icon)',
    '1em',
    '1em',
    'var(--size-m-icon)',
  ]);
});

it('sanitizes naming and focus attributes before handing props to a source', () => {
  const click = vi.fn();
  const untyped = {
    icon: fixedMark,
    usage: 'slot',
    'aria-labelledby': 'name',
    'aria-label': 'label',
    role: 'img',
    'aria-hidden': false,
    focusable: true,
    tabIndex: 0,
    tabindex: 0,
    alt: 'Vendor name',
    width: 24,
    viewBox: '1 2 3 4',
    onClick: click,
    children: <title>Slot name</title>,
  } as unknown as IconProps<typeof fixedMark>;
  const { container } = render(
    <>
      <span id="name">Linked name</span>
      <Icon icon={fixedMark} data-testid="title">
        <title> Project mark </title>
      </Icon>
      <Icon icon={fixedMark} data-testid="blank" aria-label="  " aria-labelledby="  ">
        <title>{'  '}</title>
      </Icon>
      <Icon icon={fixedMark} aria-labelledby="  name  " aria-label="Fallback" />
      <Icon {...untyped} data-testid="slot" />
      <Icon icon={fixedMark} data-testid="invalid-title">
        <desc>Invalid title</desc>
      </Icon>
      <Icon icon={fixedMark} data-testid="nested-title">
        <title>
          Invalid <tspan>markup</tspan>
        </title>
      </Icon>
    </>,
  );
  expect(screen.getByRole('img', { name: 'Project mark' })).toBe(screen.getByTestId('title'));
  expect(screen.getByRole('img', { name: 'Linked name' }).getAttribute('aria-labelledby')).toBe(
    'name',
  );
  for (const id of ['blank', 'slot', 'invalid-title', 'nested-title']) {
    const svg = screen.getByTestId(id);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 16');
    for (const key of ['aria-label', 'aria-labelledby', 'role', 'alt', 'tabindex']) {
      expect(svg.hasAttribute(key)).toBe(false);
    }
    expect(svg.querySelector('title, desc')).toBeNull();
  }
  screen.getByTestId('slot').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(click).not.toHaveBeenCalled();
  expect(container.querySelectorAll('svg')).toHaveLength(6);
});

it('lets a custom adapter replace a drawing, then clears the owner ref on null', () => {
  const replacement: IconAdapter = (_source, { svgProps }) => (
    <svg {...svgProps} data-shape="other" />
  );
  const ref = createRef<SVGSVGElement>();
  const view = render(<Icon icon={fixedMark} ref={ref} />);
  const original = ref.current;
  expect(original?.dataset.shape).toBe('mark');
  view.rerender(
    <IconProvider adapter={replacement}>
      <Icon icon={Mark} ref={ref} />
    </IconProvider>,
  );
  expect(ref.current?.dataset.shape).toBe('other');
  expect(ref.current).not.toBe(original);
  view.rerender(
    <IconProvider adapter={() => null}>
      <Icon icon={Mark} ref={ref} />
    </IconProvider>,
  );
  expect(ref.current).toBeNull();
  expect(view.container.querySelector('svg')).toBeNull();
});

it('keeps request-local adapters, SVG nodes and generated IDs through SSR and hydration', () => {
  const adapter =
    (label: string): IconAdapter =>
    (source, { svgProps }) => {
      const props = { ...svgProps, 'data-adapter': label };
      return createElement(source, props);
    };
  const ref = createRef<SVGSVGElement>();
  const view = (via: IconAdapter) => (
    <IconProvider adapter={via}>
      <Icon icon={Mark} ref={ref} />
      <Icon icon={fixedMark} />
    </IconProvider>
  );
  const status = 'ready';
  const named = renderToString(
    <Icon icon={fixedMark} aria-labelledby="icon-title">
      <title id="icon-title">Build {status}</title>
    </Icon>,
  );
  expect(named).toContain('<title id="icon-title">Build ready</title>');

  const first = view(adapter('first'));
  const firstHtml = renderToString(first);
  const secondHtml = renderToString(view(adapter('second')));
  expect(firstHtml).toContain('data-adapter="first"');
  expect(secondHtml).toContain('data-adapter="second"');
  expect(secondHtml).not.toContain('data-adapter="first"');

  const container = document.createElement('div');
  container.innerHTML = firstHtml;
  const original = container.querySelector('svg');
  const ids = Array.from(container.querySelectorAll('clipPath'), (node) => node.id);
  expect(new Set(ids).size).toBe(2);
  const recoverable = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  act(() => {
    root = hydrateRoot(container, first, { onRecoverableError: recoverable });
  });
  try {
    expect(recoverable).not.toHaveBeenCalled();
    expect(ref.current).toBe(original);
    expect(Array.from(container.querySelectorAll('clipPath'), (node) => node.id)).toEqual(ids);
  } finally {
    act(() => root?.unmount());
  }
});

afterEach(cleanup);
