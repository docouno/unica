import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createElement, createRef, cloneElement, memo, useId, useState } from 'react';
import type { ComponentPropsWithRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Icon, UnicaProvider, defineGlyph } from '../src/index.js';
import type { GlyphSvgProps, IconAdapter, IconProps } from '../src/index.js';
import { defineGlyph as serverDefineGlyph } from '../src/server.js';

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
      <UnicaProvider iconAdapter={first}>
        <Icon icon={Mark} data-testid="first" />
        <UnicaProvider iconAdapter={second}>
          <Icon icon={Mark} usage="slot" data-testid="second" ref={ref} />
          <Icon icon={fixed} data-testid="fixed" />
          <Icon icon={fixedMark} data-testid="native" />
        </UnicaProvider>
      </UnicaProvider>
      <UnicaProvider iconAdapter={first}>
        <Icon icon={Mark} data-testid="sibling" />
      </UnicaProvider>
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
  expect(serverDefineGlyph).toBe(defineGlyph);
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

it('passes optional source props including on, oneTone, stroke, and strokeWidth', () => {
  function Project({
    on,
    oneTone,
    stroke,
    strokeWidth,
    ...svg
  }: GlyphSvgProps & { on?: boolean; oneTone?: boolean; stroke?: number; strokeWidth?: number }) {
    return (
      <svg
        {...svg}
        data-on={on ? 'yes' : 'no'}
        data-tone={oneTone ? 'single' : 'multiple'}
        data-stroke={stroke}
        data-stroke-width={strokeWidth}
      />
    );
  }
  const project = defineGlyph(Project);
  const inspect = vi.fn<IconAdapter>((source, { inputProps, svgProps }) =>
    createElement(source, { ...inputProps, ...svgProps }),
  );
  render(
    <>
      <Icon icon={project} on oneTone stroke={1.5} strokeWidth={2} data-testid="native-extra" />
      <UnicaProvider iconAdapter={inspect}>
        <Icon icon={Project} on oneTone stroke={1.5} strokeWidth={2} data-testid="adapted-extra" />
      </UnicaProvider>
    </>,
  );
  for (const id of ['native-extra', 'adapted-extra']) {
    const svg = screen.getByTestId(id);
    expect(svg.getAttribute('data-on')).toBe('yes');
    expect(svg.getAttribute('data-tone')).toBe('single');
    expect(svg.getAttribute('data-stroke')).toBe('1.5');
    expect(svg.getAttribute('data-stroke-width')).toBe('2');
  }
  expect(inspect.mock.calls[0]?.[1].inputProps).toEqual({
    on: true,
    oneTone: true,
    stroke: 1.5,
    strokeWidth: 2,
  });
});

it('honors standalone defaults, fallback dimensions, color, directional, className, and slot sizing', () => {
  render(
    <UnicaProvider theme={{ preset: 'soft-dark', defaults: { Icon: { size: 'm' } } }}>
      <Icon icon={fixedMark} data-testid="theme" />
      <UnicaProvider overrides={{ Icon: { size: 's' } }}>
        <Icon icon={fixedMark} data-testid="override" />
        <UnicaProvider overrides={{ Icon: { size: undefined } }}>
          <Icon icon={fixedMark} data-testid="inherited-override" />
        </UnicaProvider>
        <UnicaProvider overrides={{ Icon: { size: 'l' } }}>
          <Icon
            icon={fixedMark}
            id="named-id"
            className="custom-icon"
            color="danger"
            directional
            data-testid="nearest"
          />
          <Icon icon={fixedMark} data-testid="instance" size="inherit" />
          <Icon icon={fixedMark} data-testid="slot" usage="slot" />
          <Icon icon={fixedMark} data-testid="sized-slot" usage="slot" size="m" />
        </UnicaProvider>
      </UnicaProvider>
      <UnicaProvider theme={{ preset: 'pixel-dark' }}>
        <Icon icon={fixedMark} data-testid="replaced-theme" />
      </UnicaProvider>
    </UnicaProvider>,
  );

  expect(
    [
      'theme',
      'override',
      'inherited-override',
      'nearest',
      'instance',
      'slot',
      'sized-slot',
      'replaced-theme',
    ].map((id) => {
      const node = screen.getByTestId(id);
      return [
        node.getAttribute('data-unica-icon-size'),
        node.getAttribute('width'),
        node.getAttribute('height'),
      ];
    }),
  ).toEqual([
    ['m', '16', '16'],
    ['s', '14', '14'],
    ['s', '14', '14'],
    ['l', '20', '20'],
    [null, '1em', '1em'],
    [null, '1em', '1em'],
    ['m', '16', '16'],
    [null, '1em', '1em'],
  ]);

  const nearest = screen.getByTestId('nearest');
  expect(nearest.id).toBe('named-id');
  expect(nearest.getAttribute('class')).toBe('unica-icon custom-icon');
  expect(nearest.getAttribute('data-unica-icon-color')).toBe('danger');
  expect(nearest.hasAttribute('data-unica-icon-directional')).toBe(true);
  expect(nearest.hasAttribute('color')).toBe(false);
  expect(screen.getByTestId('theme').hasAttribute('data-unica-icon-color')).toBe(false);
  expect(screen.getByTestId('theme').hasAttribute('data-unica-icon-directional')).toBe(false);
});

it('handles built-in phosphor adapter defaults, mirrored, and style pass-through', () => {
  const received: Record<string, unknown>[] = [];
  function FakePhosphor(props: SvgProps & { weight?: string; mirrored?: boolean; size?: string }) {
    received.push(props as Record<string, unknown>);
    return <svg data-testid={(props as Record<string, string>)['data-testid']} />;
  }
  render(
    <>
      <Icon icon={FakePhosphor} data-testid="standalone" />
      <Icon icon={FakePhosphor} usage="slot" data-testid="slot" />
      <Icon
        icon={FakePhosphor}
        weight="bold"
        mirrored
        style={{ color: 'rgb(10, 20, 30)' }}
        data-testid="styled"
      />
    </>,
  );

  expect(received[0]).toMatchObject({
    weight: 'regular',
    color: 'currentColor',
    fill: 'currentColor',
    mirrored: false,
    transform: undefined,
    alt: undefined,
    style: undefined,
    'data-unica-icon-mirrored': undefined,
  });
  expect(received[1]?.weight).toBeUndefined();
  expect(received[2]).toMatchObject({
    weight: 'bold',
    mirrored: false,
    'data-unica-icon-mirrored': '',
    style: { color: 'rgb(10, 20, 30)' },
  });
  const parsedProto = JSON.parse('{"__proto__":{"weight":"fill","mirrored":true}}') as Record<
    string,
    unknown
  >;
  const phosphorProto = {
    icon: FakePhosphor,
    ...parsedProto,
  } as unknown as IconProps<typeof FakePhosphor>;
  render(<Icon {...phosphorProto} data-testid="proto" />);
  expect(received[3]).toMatchObject({
    weight: 'regular',
    'data-unica-icon-mirrored': undefined,
  });
});

it('sanitizes naming, focus, prototype keys, and competing attributes before handing props to a source', () => {
  const click = vi.fn();
  const parsedProto = JSON.parse('{"__proto__":{"weight":"fill","mirrored":true}}') as Record<
    string,
    unknown
  >;
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
    title: 'Leaked tooltip',
    class: 'hijack',
    STYLE: 'position:fixed',
    ID: 'spoofed',
    dir: 'rtl',
    innerText: 'leaked',
    'data-UNICA-icon-size': 'l',
    width: 24,
    viewBox: '1 2 3 4',
    onClick: click,
    children: <title>Slot name</title>,
    ...parsedProto,
  } as unknown as IconProps<typeof fixedMark>;
  const status = 'ready';
  const { container } = render(
    <>
      <span id="name">Linked name</span>
      <Icon icon={fixedMark} data-testid="title">
        <title lang="en" dir="rtl">
          <> Project {status} </>
        </title>
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
  const titleSvg = screen.getByRole('img', { name: 'Project ready' });
  expect(titleSvg).toBe(screen.getByTestId('title'));
  expect(titleSvg.querySelector('title')?.getAttribute('lang')).toBe('en');
  expect(titleSvg.querySelector('title')?.getAttribute('dir')).toBe('rtl');
  expect(screen.getByRole('img', { name: 'Linked name' }).getAttribute('aria-labelledby')).toBe(
    'name',
  );
  for (const id of ['blank', 'slot', 'invalid-title', 'nested-title']) {
    const svg = screen.getByTestId(id);
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('focusable')).toBe('false');
    expect(svg.getAttribute('class')).toBe('unica-icon');
    expect(svg.getAttribute('viewBox')).toBe('0 0 32 16');
    for (const key of [
      'aria-label',
      'aria-labelledby',
      'role',
      'alt',
      'title',
      'dir',
      'tabindex',
      'data-unica-icon-size',
      'data-unica-icon-mirrored',
    ]) {
      expect(svg.hasAttribute(key)).toBe(false);
    }
    expect(svg.querySelector('title, desc')).toBeNull();
  }
  screen.getByTestId('slot').dispatchEvent(new MouseEvent('click', { bubbles: true }));
  expect(click).not.toHaveBeenCalled();
  expect(container.querySelectorAll('svg')).toHaveLength(6);

  const ssrSlot = renderToString(<Icon {...untyped} id="real" style={{ opacity: 0.5 }} />);
  expect(ssrSlot).not.toContain('class="hijack"');
  expect(ssrSlot).not.toContain('STYLE=');
  expect(ssrSlot).not.toContain('ID=');
  expect(ssrSlot).not.toContain('data-UNICA-icon-size');
  expect(ssrSlot).not.toContain('innerText');
  expect(ssrSlot).not.toContain('title="Leaked tooltip"');
  expect(ssrSlot).not.toContain('dir="rtl"');
  expect(ssrSlot).toContain('class="unica-icon"');
  expect(ssrSlot).toContain('id="real"');
  expect(ssrSlot).toContain('style="opacity:0.5"');
});

it('recognizes Flight-serialized descriptors and rejects invalid adapters or non-callable glyphs loudly', () => {
  const serialized = {
    '~unica.glyph': true as const,
    source: Mark,
    adapter: 'native' as const,
  };
  const { container } = render(
    <UnicaProvider iconAdapter={() => null}>
      <Icon icon={serialized} data-testid="serialized" />
    </UnicaProvider>,
  );
  expect(container.querySelector('[data-testid="serialized"]')?.getAttribute('data-shape')).toBe(
    'mark',
  );

  for (const badAdapter of ['toString', 'constructor', 'valueOf', '__proto__', 'lucide']) {
    expect(() => defineGlyph(Mark, badAdapter as never)).toThrow(TypeError);
    expect(() =>
      renderToString(
        <UnicaProvider iconAdapter={badAdapter as never}>
          <Icon icon={Mark} />
        </UnicaProvider>,
      ),
    ).toThrow(TypeError);
  }
  for (const badSource of [
    null,
    undefined,
    'Arrow',
    42,
    {},
    <Mark key="el" />,
    fixedMark,
    { '~unica.glyph': true, source: null, adapter: 'native' },
  ]) {
    expect(() => defineGlyph(badSource as never)).toThrow(TypeError);
    if (badSource !== fixedMark) {
      expect(() => renderToString(<Icon icon={badSource as never} />)).toThrow(TypeError);
    }
  }
  for (const badSize of ['__proto__', 'toString', 'xl']) {
    const html = renderToString(<Icon icon={fixedMark} size={badSize as never} />);
    expect(html).toContain('width="1em"');
    expect(html).toContain('height="1em"');
    expect(html).not.toContain('data-unica-icon-size');
  }
});

it('omits own children key on unnamed svgProps so cloneElement adapters keep SVG drawing', () => {
  const prebuilt = (
    <svg viewBox="0 0 16 16">
      <path d="M0 0h16v16H0z" />
    </svg>
  );
  let hasOwnChildren: boolean | undefined;
  const cloneAdapter: IconAdapter = (_source, { svgProps }) => {
    hasOwnChildren = Object.hasOwn(svgProps, 'children');
    return cloneElement(prebuilt, svgProps);
  };
  const { container } = render(
    <UnicaProvider iconAdapter={cloneAdapter}>
      <Icon icon={Mark} />
    </UnicaProvider>,
  );
  expect(hasOwnChildren).toBe(false);
  expect(container.querySelector('svg > path')).not.toBeNull();
});

it('avoids context fan-out rerenders on slots, sized icons, and pinned glyphs', () => {
  let slotRenders = 0;
  let sizedRenders = 0;
  let fixedRenders = 0;
  const SlotGlyph = defineGlyph(function SlotSvg(props: SvgProps) {
    slotRenders++;
    return <svg {...props} />;
  });
  const SizedGlyph = defineGlyph(function SizedSvg(props: SvgProps) {
    sizedRenders++;
    return <svg {...props} />;
  });
  const FixedGlyph = defineGlyph(function FixedSvg(props: SvgProps) {
    fixedRenders++;
    return <svg {...props} />;
  });
  const Frozen = memo(function Frozen() {
    return (
      <>
        <Icon icon={SlotGlyph} usage="slot" />
        <Icon icon={SizedGlyph} size="m" />
        <Icon icon={FixedGlyph} size="s" />
      </>
    );
  });
  function Harness() {
    const [tick, setTick] = useState(0);
    const [adapter, setAdapter] = useState<'phosphor' | 'native'>('phosphor');
    return (
      <UnicaProvider
        overrides={{ Icon: { size: tick % 2 === 0 ? 's' : 'l' } }}
        iconAdapter={adapter}
      >
        <button type="button" onClick={() => setTick((n) => n + 1)}>
          Flip theme
        </button>
        <button
          type="button"
          onClick={() => setAdapter((current) => (current === 'phosphor' ? 'native' : 'phosphor'))}
        >
          Flip adapter
        </button>
        <Frozen />
      </UnicaProvider>
    );
  }
  render(<Harness />);
  expect([slotRenders, sizedRenders, fixedRenders]).toEqual([1, 1, 1]);
  fireEvent.click(screen.getByRole('button', { name: 'Flip theme' }));
  expect([slotRenders, sizedRenders, fixedRenders]).toEqual([1, 1, 1]);
  fireEvent.click(screen.getByRole('button', { name: 'Flip adapter' }));
  expect([slotRenders, sizedRenders, fixedRenders]).toEqual([1, 1, 1]);
});

it('switches cleanly between pinned and provider-resolved sources and sizes on one instance', () => {
  const custom: IconAdapter = (source, { svgProps }) =>
    createElement(source, { ...svgProps, 'data-via': 'custom' });
  const view = render(
    <UnicaProvider overrides={{ Icon: { size: 's' } }} iconAdapter={custom}>
      <Icon icon={fixedMark} size="l" data-testid="dynamic" />
    </UnicaProvider>,
  );
  expect(screen.getByTestId('dynamic').getAttribute('data-via')).toBeNull();
  expect(screen.getByTestId('dynamic').getAttribute('data-unica-icon-size')).toBe('l');

  view.rerender(
    <UnicaProvider overrides={{ Icon: { size: 's' } }} iconAdapter={custom}>
      <Icon icon={Mark} data-testid="dynamic" />
    </UnicaProvider>,
  );
  expect(screen.getByTestId('dynamic').getAttribute('data-via')).toBe('custom');
  expect(screen.getByTestId('dynamic').getAttribute('data-unica-icon-size')).toBe('s');

  view.rerender(
    <UnicaProvider overrides={{ Icon: { size: 'm' } }} iconAdapter={custom}>
      <Icon icon={fixedMark} size="inherit" data-testid="dynamic" />
    </UnicaProvider>,
  );
  expect(screen.getByTestId('dynamic').getAttribute('data-via')).toBeNull();
  expect(screen.getByTestId('dynamic').getAttribute('data-unica-icon-size')).toBeNull();
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
    <UnicaProvider iconAdapter={replacement}>
      <Icon icon={Mark} ref={ref} />
    </UnicaProvider>,
  );
  expect(ref.current?.dataset.shape).toBe('other');
  expect(ref.current).not.toBe(original);
  view.rerender(
    <UnicaProvider iconAdapter={() => null}>
      <Icon icon={Mark} ref={ref} />
    </UnicaProvider>,
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
    <UnicaProvider iconAdapter={via}>
      <Icon icon={Mark} ref={ref} />
      <Icon icon={fixedMark} />
    </UnicaProvider>
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
