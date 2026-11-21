import { Children, Fragment, createContext, isValidElement, use } from 'react';
import type {
  AriaAttributes,
  CSSProperties,
  ComponentPropsWithRef,
  DOMAttributes,
  JSX,
  ReactElement,
  ReactNode,
} from 'react';
import { useComponentDefaults } from '../../core/UnicaProvider.js';
import { isGlyphDefinition, renderGlyph } from './glyph.js';
import type {
  BuiltinIconAdapterName,
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  GlyphSvgProps,
  IconAdapter,
} from './glyph.js';
import './icon.css';

export type IconSize = 'inherit' | 's' | 'm' | 'l';

export type IconColor =
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

export type IconUsage = 'standalone' | 'slot';

export interface IconProviderProps {
  readonly adapter: BuiltinIconAdapterName | IconAdapter;
  readonly children: ReactNode;
}

const IconContext = /* @__PURE__ */ createContext<BuiltinIconAdapterName | IconAdapter>('phosphor');

export function IconProvider({ adapter, children }: IconProviderProps): JSX.Element {
  return <IconContext value={adapter}>{children}</IconContext>;
}

type IconTitle = ReactElement<
  {
    children?: ReactNode;
    id?: string | undefined;
    lang?: string | undefined;
    dir?: 'ltr' | 'rtl' | 'auto' | undefined;
  },
  'title'
>;

type IconStyle =
  | CSSProperties
  | (CSSProperties & {
      readonly [property: `--${string}`]: string | number | undefined;
    });

type UpperLetter =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

const reservedInputProps = /* @__PURE__ */ new Set([
  '__proto__',
  'class',
  'classname',
  'style',
  'id',
  'ref',
  'children',
  'key',
  'role',
  'alt',
  'title',
  'dir',
  'focusable',
  'tabindex',
  'width',
  'height',
  'viewbox',
  'preserveaspectratio',
  'transform',
  'dangerouslysetinnerhtml',
  'innertext',
  'textcontent',
  'popover',
  'hidden',
  'inert',
  'accesskey',
  'contenteditable',
  'is',
]);

const fallbackDimensions: Readonly<Record<IconSize, string>> = {
  inherit: '1em',
  s: '14',
  m: '16',
  l: '20',
};

const EMPTY_INPUT_PROPS: Readonly<Record<string, unknown>> = /* @__PURE__ */ Object.freeze({});

interface IconFrame<G extends GlyphSource> {
  readonly icon: G;
  readonly size?: IconSize | undefined;
  readonly color?: IconColor | undefined;
  readonly directional?: boolean | undefined;
  readonly ref?: GlyphSvgProps['ref'] | undefined;
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
      readonly children?: IconTitle | false | null | undefined;
    }
  | {
      readonly usage: 'slot';
      readonly 'aria-labelledby'?: never;
      readonly 'aria-label'?: never;
      readonly children?: never;
    };

type ClosedSvgKey =
  | Exclude<keyof AriaAttributes, 'aria-label' | 'aria-labelledby'>
  | Exclude<keyof DOMAttributes<SVGSVGElement>, 'children'>
  | 'role'
  | 'alt'
  | 'title'
  | 'dir'
  | 'focusable'
  | 'tabIndex'
  | 'width'
  | 'height'
  | 'viewBox'
  | 'preserveAspectRatio'
  | 'transform';

type ClosedProps = {
  readonly [K in ClosedSvgKey]?: never;
};

type GlyphCallable<G> =
  G extends GlyphDefinition<infer Source> ? Source : Extract<G, GlyphComponent>;

type OwnedKey =
  | keyof IconFrame<GlyphSource>
  | keyof IconName
  | ClosedSvgKey
  | 'key'
  | `on${UpperLetter}${string}`;

type SvgInherited = Omit<ComponentPropsWithRef<'svg'>, 'strokeWidth'>;

type IsInheritedSvgKey<Props, K extends keyof Props> = K extends keyof SvgInherited
  ? [NonNullable<SvgInherited[K]>] extends [NonNullable<Props[K]>]
    ? [NonNullable<Props[K]>] extends [NonNullable<SvgInherited[K]>]
      ? true
      : false
    : false
  : false;

type LiteralKey<K> = K extends string
  ? string extends K
    ? never
    : K
  : K extends number
    ? number extends K
      ? never
      : K
    : K extends symbol
      ? symbol extends K
        ? never
        : K
      : never;

type OwnVendorKey<Props> = {
  [K in Exclude<keyof Props, OwnedKey>]-?: 'xmlns' extends keyof Props
    ? IsInheritedSvgKey<Props, K> extends true
      ? never
      : LiteralKey<K>
    : LiteralKey<K>;
}[Exclude<keyof Props, OwnedKey>];

type VendorKeys<Props> = 0 extends 1 & Props
  ? never
  : Props extends unknown
    ? OwnVendorKey<Props>
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
    ? { readonly [K in Keys]?: undefined } extends Options
      ? Options
      : Options | { readonly [K in Keys]?: undefined }
    : never;

export type IconProps<G extends GlyphSource = GlyphSource> = IconFrame<G> &
  IconName &
  ClosedProps &
  SourceOptions<GlyphCallable<G>>;

function textName(value: string | undefined): string | undefined {
  return typeof value === 'string' ? value.trim() || undefined : undefined;
}

function collectTitleText(node: ReactNode): string | undefined {
  let content = '';
  for (const part of Children.toArray(node)) {
    if (typeof part === 'string' || typeof part === 'number' || typeof part === 'bigint') {
      content += String(part);
    } else if (isValidElement<{ children?: ReactNode }>(part) && part.type === Fragment) {
      const nested = collectTitleText(part.props.children);
      if (nested === undefined) {
        return undefined;
      }
      content += nested;
    } else {
      return undefined;
    }
  }
  return content;
}

function svgTitle(child: IconTitle | false | null | undefined): IconTitle | undefined {
  if (!isValidElement(child) || child.type !== 'title') {
    return undefined;
  }
  const raw = collectTitleText(child.props.children);
  const text = raw?.trim();
  if (!text) {
    return undefined;
  }
  const titleId = typeof child.props.id === 'string' ? child.props.id : undefined;
  const titleLang = typeof child.props.lang === 'string' ? child.props.lang : undefined;
  const titleDir =
    child.props.dir === 'ltr' || child.props.dir === 'rtl' || child.props.dir === 'auto'
      ? child.props.dir
      : undefined;
  return (
    <title id={titleId} lang={titleLang} dir={titleDir}>
      {text}
    </title>
  );
}

type FrameKey = keyof IconFrame<GlyphSource> | keyof IconName | ClosedSvgKey | 'key';
type AllKeys<T> = T extends unknown ? keyof T : never;

export function Icon<G extends GlyphSource>(props: IconProps<G>): ReactElement | null;
export function Icon<P extends IconFrame<GlyphSource> & IconName & ClosedProps>(
  props: P & ([Exclude<AllKeys<P>, FrameKey>] extends [never] ? unknown : never),
): ReactElement | null;
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
  const providerAdapter = isGlyphDefinition(icon) ? 'native' : use(IconContext);
  const frameSize = useComponentDefaults('Icon', 'size', {
    instance: size,
    group: usage === 'slot' ? 'inherit' : undefined,
    builtIn: 'inherit',
  });
  const resolvedSize: IconSize = Object.hasOwn(fallbackDimensions, frameSize)
    ? frameSize
    : 'inherit';
  const dimension = fallbackDimensions[resolvedSize];
  const standalone = usage === 'standalone';
  const name = standalone ? textName(label) : undefined;
  const nameIds = standalone ? textName(labelledBy) : undefined;
  const title = standalone ? svgTitle(children) : undefined;
  const named = name !== undefined || nameIds !== undefined || title !== undefined;

  let inputProps: Record<string, unknown> | undefined;
  let dataProps: Record<string, unknown> | undefined;
  for (const key in props) {
    if (!Object.hasOwn(props, key)) {
      continue;
    }
    const value = (props as Record<string, unknown>)[key];
    if (key.startsWith('data-')) {
      if (!/^data-unica-icon-/i.test(key)) {
        (dataProps ??= {})[key] = value;
      }
    } else if (
      value !== undefined &&
      !/^data-/i.test(key) &&
      !/^aria-/i.test(key) &&
      !/^on[A-Z]/.test(key) &&
      !reservedInputProps.has(key.toLowerCase())
    ) {
      (inputProps ??= {})[key] = value;
    }
  }

  const svgProps: Record<string, unknown> = {
    ...dataProps,
    className: className ? `unica-icon ${className}` : 'unica-icon',
    focusable: 'false',
    width: dimension,
    height: dimension,
  };
  if (ref !== undefined) {
    svgProps.ref = ref;
  }
  if (id !== undefined) {
    svgProps.id = id;
  }
  if (style !== undefined) {
    svgProps.style = style;
  }
  if (resolvedSize !== 'inherit') {
    svgProps['data-unica-icon-size'] = resolvedSize;
  }
  if (color !== 'inherit') {
    svgProps['data-unica-icon-color'] = color;
  }
  if (directional) {
    svgProps['data-unica-icon-directional'] = '';
  }
  if (named) {
    svgProps.role = 'img';
    if (name !== undefined) {
      svgProps['aria-label'] = name;
    }
    if (nameIds !== undefined) {
      svgProps['aria-labelledby'] = nameIds;
    }
    if (title !== undefined) {
      svgProps.children = title;
    }
  } else {
    svgProps['aria-hidden'] = true;
  }

  return renderGlyph(icon, providerAdapter, {
    inputProps: inputProps ?? EMPTY_INPUT_PROPS,
    svgProps: svgProps as GlyphSvgProps,
    usage,
  });
}
