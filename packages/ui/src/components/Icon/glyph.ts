import { createElement } from 'react';
import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';

type SvgProps = Omit<ComponentPropsWithRef<'svg'>, 'color'> & { readonly color?: string };

type SvgDataProps = {
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

export type GlyphComponent = (props: SvgProps) => ReactNode;

export type BuiltinIconAdapterName = 'native' | 'phosphor';

export interface IconAdapterRenderContext {
  readonly inputProps: Readonly<Record<string, unknown>>;
  readonly svgProps: Readonly<SvgProps> & SvgDataProps;
  readonly usage: 'standalone' | 'slot';
}

export type IconAdapter = (
  source: GlyphComponent,
  context: IconAdapterRenderContext,
) => ReactElement | null;

const glyphDefinition: unique symbol = Symbol.for('@docouno/unica/GlyphDefinition');

export interface GlyphDefinition<G extends GlyphComponent = GlyphComponent> {
  readonly [glyphDefinition]: true;
  readonly source: G;
  readonly adapter: BuiltinIconAdapterName | IconAdapter;
}

export type GlyphSource = GlyphComponent | GlyphDefinition;

export function defineGlyph<G extends GlyphComponent>(
  source: G,
  adapter: BuiltinIconAdapterName | IconAdapter = 'native',
): GlyphDefinition<G> {
  return Object.freeze<GlyphDefinition<G>>({ [glyphDefinition]: true, source, adapter });
}

function isGlyphDefinition(glyph: GlyphSource): glyph is GlyphDefinition {
  return glyphDefinition in glyph && glyph[glyphDefinition] === true;
}

const builtinAdapters: Readonly<Record<BuiltinIconAdapterName, IconAdapter>> = {
  native: (source, { inputProps, svgProps }) =>
    createElement(source, { ...inputProps, ...svgProps }),
  phosphor: (source, { inputProps, svgProps, usage }) => {
    const props = {
      ...inputProps,
      ...svgProps,
      size: svgProps.width,
      weight: inputProps.weight ?? (usage === 'standalone' ? 'regular' : undefined),
      color: 'currentColor',
      fill: 'currentColor',
      style:
        svgProps.style?.fill === undefined
          ? svgProps.style
          : { ...svgProps.style, fill: 'currentColor' },
      alt: undefined,
      mirrored: false,
      // Phosphor gives its context an OR fallback for mirrored. Override the
      // resulting attribute and let CSS handle both kinds of reflection.
      transform: undefined,
      'data-unica-icon-mirrored': inputProps.mirrored === true ? '' : undefined,
    };
    return createElement(source, props);
  },
};

export function renderGlyph(
  glyph: GlyphSource,
  provider: BuiltinIconAdapterName | IconAdapter,
  context: IconAdapterRenderContext,
): ReactElement | null {
  const [source, adapter] = isGlyphDefinition(glyph)
    ? [glyph.source, glyph.adapter]
    : [glyph, provider];
  const render = typeof adapter === 'string' ? builtinAdapters[adapter] : adapter;
  return render(source, context);
}
