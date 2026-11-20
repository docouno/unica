import { Children, createContext, isValidElement, useContext } from 'react';
import type { Attributes, CSSProperties, JSX, ReactElement, ReactNode } from 'react';
import { useComponentDefaults } from '../../core/UnicaProvider.js';
import { renderGlyph } from './glyph.js';
import type {
  BuiltinIconAdapterName,
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  IconAdapter,
  IconAdapterRenderContext,
} from './glyph.js';
import './icon.css';

type Adapter = BuiltinIconAdapterName | IconAdapter;

const IconContext = /* @__PURE__ */ createContext<Adapter>('phosphor');

export function IconProvider({
  adapter,
  children,
}: {
  readonly adapter: Adapter;
  readonly children: ReactNode;
}): JSX.Element {
  return <IconContext value={adapter}>{children}</IconContext>;
}

type IconColor =
  | 'inherit'
  | 'primary'
  | 'secondary'
  | 'muted'
  | 'subtle'
  | 'disabled'
  | 'accent'
  | 'info'
  | 'success'
  | 'warning'
  | 'danger';

type SvgProps = IconAdapterRenderContext['svgProps'];
type IconTitle = ReactElement<{ children?: ReactNode; id?: string; lang?: string }, 'title'>;
type IconStyle = CSSProperties & {
  readonly [property: `--${string}`]: string | number | undefined;
};

const reservedInputProps = new Set([
  'role',
  'alt',
  'focusable',
  'tabindex',
  'width',
  'height',
  'viewbox',
  'preserveaspectratio',
  'transform',
  'fill',
  'stroke',
  'dangerouslysetinnerhtml',
]);

interface IconFrame<G extends GlyphSource> extends Attributes {
  readonly icon: G;
  readonly size?: 'inherit' | 's' | 'm' | 'l' | undefined;
  readonly color?: IconColor | undefined;
  readonly directional?: boolean | undefined;
  readonly ref?: SvgProps['ref'];
  readonly id?: string | undefined;
  readonly className?: string | undefined;
  readonly style?: IconStyle | undefined;
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
}

type IconName =
  | {
      readonly usage?: 'standalone' | undefined;
      readonly 'aria-labelledby'?: string | undefined;
      readonly 'aria-label'?: string | undefined;
      readonly children?: IconTitle | undefined;
    }
  | {
      readonly usage: 'slot';
      readonly 'aria-labelledby'?: never;
      readonly 'aria-label'?: never;
      readonly children?: never;
    };

type ClosedProps = {
  readonly [
    K in Exclude<keyof SvgProps | 'alt', keyof IconFrame<GlyphSource> | keyof IconName>
  ]?: never;
};

type GlyphCallable<G> =
  G extends GlyphDefinition<infer Source> ? Source : Extract<G, GlyphComponent>;

type OwnedKey =
  keyof IconFrame<GlyphSource> | keyof IconName | keyof ClosedProps | `on${Capitalize<string>}`;

type VendorKeys<Props> = 0 extends 1 & Props
  ? never
  : Props extends unknown
    ? Exclude<keyof Props, OwnedKey>
    : never;

// Omitted vendor options and explicit undefined behave alike. Required options need a value.
type VendorProps<Props, Keys extends PropertyKey> = Props extends unknown
  ? {
      readonly [K in keyof Props as K extends Keys ? K : never]: Partial<
        Pick<Props, K>
      > extends Pick<Props, K>
        ? Props[K] | undefined
        : Exclude<Props[K], undefined>;
    } & { readonly [K in Exclude<Keys, keyof Props>]?: never }
  : never;

// A dynamic source accepts only shared options. Every glyph also accepts a bare SVG,
// even when its final overload requires options.
type SourceOptions<
  G extends GlyphComponent,
  Keys extends PropertyKey = VendorKeys<Parameters<G>[0]>,
> = [Keys] extends [never]
  ? unknown
  : (G extends unknown ? (options: VendorProps<Parameters<G>[0], Keys>) => void : never) extends (
        options: infer Options,
      ) => void
    ? Options | { readonly [K in Keys]?: undefined }
    : never;

export type IconProps<G extends GlyphSource = GlyphSource> = IconFrame<G> &
  IconName &
  ClosedProps &
  SourceOptions<GlyphCallable<G>>;

function textName(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function svgTitle(child: IconTitle | undefined): IconTitle | undefined {
  if (!isValidElement(child) || child.type !== 'title') {
    return undefined;
  }
  let content = '';
  for (const part of Children.toArray(child.props.children)) {
    if (typeof part !== 'string' && typeof part !== 'number' && typeof part !== 'bigint') {
      return undefined;
    }
    content += String(part);
  }
  const text = content.trim();
  return text ? (
    <title id={child.props.id} lang={child.props.lang}>
      {text}
    </title>
  ) : undefined;
}

const frameStyleKeys = new Set([
  'all',
  'font',
  'fontSize',
  'color',
  'width',
  'height',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'inlineSize',
  'blockSize',
  'minInlineSize',
  'maxInlineSize',
  'minBlockSize',
  'maxBlockSize',
]);

export function Icon<G extends GlyphSource>({
  icon,
  size,
  color = 'inherit',
  directional,
  usage = 'standalone',
  ref,
  id,
  className,
  style,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  children,
  ...props
}: IconProps<G>): ReactElement | null {
  const providerAdapter = useContext(IconContext);
  const frameSize = useComponentDefaults('Icon', 'size', {
    instance: size,
    group: usage === 'slot' ? 'inherit' : undefined,
    builtIn: 'inherit',
  });
  const dimension = frameSize === 'inherit' ? '1em' : `var(--size-${frameSize}-icon)`;
  const standalone = usage === 'standalone';
  const name = standalone ? textName(label) : undefined;
  const nameIds = standalone ? textName(labelledBy) : undefined;
  const title = standalone ? svgTitle(children) : undefined;
  const named = name !== undefined || nameIds !== undefined || title !== undefined;

  const inputProps: Record<string, unknown> = {};
  const dataProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('data-')) {
      dataProps[key] = value;
    } else if (
      value !== undefined &&
      !/^aria-/i.test(key) &&
      !/^on[A-Z]/.test(key) &&
      !reservedInputProps.has(key.toLowerCase())
    ) {
      inputProps[key] = value;
    }
  }

  const frameStyle =
    style &&
    Object.fromEntries(Object.entries(style).filter(([property]) => !frameStyleKeys.has(property)));

  const svgProps = {
    ...dataProps,
    ref,
    id,
    color: 'currentColor',
    className: className ? `unica-icon ${className}` : 'unica-icon',
    'data-unica-icon-size': frameSize === 'inherit' ? undefined : frameSize,
    'data-unica-icon-color': color === 'inherit' ? undefined : color,
    'data-unica-icon-directional': directional ? '' : undefined,
    'data-unica-icon-mirrored': undefined,
    focusable: 'false',
    tabIndex: undefined,
    'aria-hidden': named ? undefined : true,
    'aria-label': name,
    'aria-labelledby': nameIds,
    role: named ? 'img' : undefined,
    children: title,
    width: dimension,
    height: dimension,
    style: frameStyle,
  } satisfies SvgProps & Record<`data-${string}`, unknown>;
  return renderGlyph(icon, providerAdapter, { inputProps, svgProps, usage });
}
