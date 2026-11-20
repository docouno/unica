import { createContext, isValidElement, useContext } from 'react';
import type { CSSProperties, JSX, ReactElement, ReactNode } from 'react';
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

const colors = {
  inherit: 'inherit',
  primary: 'var(--fg-primary)',
  secondary: 'var(--fg-secondary)',
  muted: 'var(--fg-muted)',
  subtle: 'var(--fg-subtle)',
  disabled: 'var(--fg-disabled)',
  accent: 'var(--accent-signal)',
  info: 'var(--status-info-signal)',
  success: 'var(--status-success-signal)',
  warning: 'var(--status-warning-signal)',
  danger: 'var(--status-danger-signal)',
} as const;

type SvgProps = IconAdapterRenderContext['svgProps'];
type IconTitle = ReactElement<{ children: string }, 'title'>;
type IconStyle = CSSProperties & {
  readonly [property: `--${string}`]: string | number | undefined;
};

const reservedInputProps = new Set([
  'role',
  'alt',
  'focusable',
  'tabIndex',
  'width',
  'height',
  'viewBox',
  'preserveAspectRatio',
  'transform',
  'fill',
  'stroke',
  'dangerouslySetInnerHTML',
]);

interface IconFrame<G extends GlyphSource> {
  readonly icon: G;
  readonly size?: 'inherit' | 's' | 'm' | 'l' | undefined;
  readonly color?: keyof typeof colors | undefined;
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

type SourceProps<G> =
  G extends GlyphDefinition<infer Source>
    ? Parameters<Source>[0]
    : G extends GlyphComponent
      ? Parameters<G>[0]
      : never;

type VendorProps<Props> = [Props] extends [never]
  ? unknown
  : 0 extends 1 & Props
    ? unknown
    : {
        readonly [
          K in Exclude<
            keyof Props,
            | keyof IconFrame<GlyphSource>
            | keyof IconName
            | keyof ClosedProps
            | `on${Capitalize<string>}`
          >
        ]?: Props[K] | undefined;
      };

type SourceOptions<G extends GlyphSource> = GlyphSource extends G
  ? unknown
  : VendorProps<SourceProps<G>>;

export type IconProps<G extends GlyphSource = GlyphSource> = IconFrame<G> &
  IconName &
  ClosedProps &
  NoInfer<SourceOptions<G>>;

function textName(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function titleName(children: IconTitle | undefined): string | undefined {
  return isValidElement(children) && children.type === 'title'
    ? textName(children.props.children)
    : undefined;
}

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
  const resolvedSize = useComponentDefaults('Icon', 'size', { instance: size, builtIn: 'inherit' });
  const frameSize = usage === 'slot' ? (size ?? 'inherit') : resolvedSize;
  const dimension = frameSize === 'inherit' ? '1em' : `var(--size-${frameSize}-icon)`;
  const standalone = usage === 'standalone';
  const name = standalone ? textName(label) : undefined;
  const nameIds = standalone ? textName(labelledBy) : undefined;
  const title = standalone ? titleName(children) : undefined;
  const named = name !== undefined || nameIds !== undefined || title !== undefined;

  const inputProps: Record<string, unknown> = {};
  const dataProps: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('data-')) {
      dataProps[key] = value;
    } else if (!/^(aria-|on[A-Z])/.test(key) && !reservedInputProps.has(key)) {
      inputProps[key] = value;
    }
  }

  const frameStyle = { ...style };
  // A 1em frame uses the host's font size. Keep font styling in the CSS cascade.
  delete frameStyle.font;
  delete frameStyle.fontSize;

  const svgProps = {
    ...dataProps,
    ref,
    id,
    color: 'currentColor',
    className: className ? `unica-icon ${className}` : 'unica-icon',
    'data-unica-icon-directional': directional ? '' : undefined,
    'data-unica-icon-mirrored': undefined,
    focusable: 'false',
    tabIndex: undefined,
    'aria-hidden': named ? undefined : true,
    'aria-label': name,
    'aria-labelledby': nameIds,
    role: named ? 'img' : undefined,
    children: title === undefined ? undefined : <title>{title}</title>,
    width: dimension,
    height: dimension,
    style: {
      ...frameStyle,
      width: dimension,
      height: dimension,
      minWidth: dimension,
      maxWidth: dimension,
      minHeight: dimension,
      maxHeight: dimension,
      inlineSize: dimension,
      blockSize: dimension,
      minInlineSize: dimension,
      maxInlineSize: dimension,
      minBlockSize: dimension,
      maxBlockSize: dimension,
      color: colors[color],
    },
  } satisfies SvgProps & Record<`data-${string}`, unknown>;
  return renderGlyph(icon, providerAdapter, { inputProps, svgProps, usage });
}
