import { createElement, isValidElement } from 'react';
import type { AriaRole, CSSProperties, ReactElement, ReactNode, Ref } from 'react';

export type GlyphSvgProps = {
  readonly ref?: Ref<SVGSVGElement>;
  readonly id?: string;
  readonly className?: string;
  readonly style?: CSSProperties;
  readonly width?: string | number;
  readonly height?: string | number;
  readonly color?: string;
  readonly focusable?: 'false';
  readonly role?: AriaRole;
  readonly 'aria-hidden'?: boolean | 'true' | 'false';
  readonly 'aria-label'?: string;
  readonly 'aria-labelledby'?: string;
  readonly children?: ReactNode;
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

export type GlyphComponent = (props: GlyphSvgProps) => ReactNode | Promise<ReactNode>;

export type BuiltinIconAdapterName = 'native' | 'phosphor';

export interface IconAdapterRenderContext {
  readonly inputProps: Readonly<Record<string, unknown>>;
  readonly svgProps: GlyphSvgProps;
  readonly usage: 'standalone' | 'slot';
}

export type IconAdapter = (
  source: GlyphComponent,
  context: IconAdapterRenderContext,
) => ReactElement | null;

export interface GlyphDefinition<G extends GlyphComponent = GlyphComponent> {
  readonly '~unica.glyph': true;
  readonly source: G;
  readonly adapter: BuiltinIconAdapterName | IconAdapter;
}

export type GlyphSource = GlyphComponent | GlyphDefinition;

function assertCallableGlyph(source: unknown, origin: string): void {
  if (
    typeof source !== 'function' &&
    (typeof source !== 'object' ||
      source === null ||
      isValidElement(source) ||
      typeof (source as { $$typeof?: unknown }).$$typeof !== 'symbol')
  ) {
    throw new TypeError(`${origin} requires a callable React SVG component.`);
  }
}

const nativeAdapter: IconAdapter = (source, { inputProps, svgProps }) => {
  for (const key in inputProps) {
    if (Object.hasOwn(inputProps, key)) {
      return createElement(source, { ...inputProps, ...svgProps });
    }
  }
  return createElement(source, svgProps);
};

const phosphorAdapter: IconAdapter = (source, { inputProps, svgProps, usage }) => {
  const props = {
    ...inputProps,
    role: undefined,
    tabIndex: undefined,
    'aria-hidden': undefined,
    'aria-label': undefined,
    'aria-labelledby': undefined,
    style: undefined,
    'data-unica-icon-size': undefined,
    'data-unica-icon-color': undefined,
    'data-unica-icon-directional': undefined,
    ...svgProps,
    size: svgProps.width,
    weight: inputProps.weight ?? (usage === 'standalone' ? 'regular' : undefined),
    color: 'currentColor',
    fill: 'currentColor',
    alt: undefined,
    mirrored: false,
    // Phosphor gives its context an OR fallback for mirrored. Override the
    // resulting attribute and let CSS handle both kinds of reflection.
    transform: undefined,
    'data-unica-icon-mirrored': inputProps.mirrored === true ? '' : undefined,
  };
  return createElement(source, props as GlyphSvgProps);
};

function resolveAdapter(adapter: BuiltinIconAdapterName | IconAdapter): IconAdapter {
  if (typeof adapter === 'function') {
    return adapter;
  }
  if (adapter === 'phosphor') {
    return phosphorAdapter;
  }
  if (adapter === 'native') {
    return nativeAdapter;
  }
  throw new TypeError(`Unknown Icon adapter: ${String(adapter)}`);
}

/* @__NO_SIDE_EFFECTS__ */
export function defineGlyph<G extends GlyphComponent>(
  source: G,
  adapter: BuiltinIconAdapterName | IconAdapter = 'native',
): GlyphDefinition<G> {
  assertCallableGlyph(source, 'defineGlyph');
  resolveAdapter(adapter);
  return Object.freeze<GlyphDefinition<G>>({
    '~unica.glyph': true,
    source,
    adapter,
  });
}

export function isGlyphDefinition(glyph: unknown): glyph is GlyphDefinition {
  return (
    typeof glyph === 'object' &&
    glyph !== null &&
    Object.hasOwn(glyph, '~unica.glyph') &&
    (glyph as Record<string, unknown>)['~unica.glyph'] === true
  );
}

export function renderGlyph(
  glyph: GlyphSource,
  provider: BuiltinIconAdapterName | IconAdapter,
  context: IconAdapterRenderContext,
): ReactElement | null {
  let source: GlyphComponent;
  let adapter: BuiltinIconAdapterName | IconAdapter;
  if (isGlyphDefinition(glyph)) {
    source = glyph.source;
    adapter = glyph.adapter;
  } else {
    source = glyph;
    adapter = provider;
  }
  assertCallableGlyph(source, 'Icon');
  return resolveAdapter(adapter)(source, context);
}
