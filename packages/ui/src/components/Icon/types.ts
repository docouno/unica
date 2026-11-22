import type {
  AriaAttributes,
  CSSProperties,
  ComponentPropsWithRef,
  DOMAttributes,
  ReactElement,
  ReactNode,
} from 'react';
import type { TEXT_COLOR } from '../../consts.js';
import type { IconSize } from '../../core/defaults.js';
import type {
  GlyphComponent,
  GlyphDefinition,
  GlyphSource,
  GlyphSvgProps,
} from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { ICON_COLOR, ICON_USAGE } from './consts.js';

export type { IconSize } from '../../core/defaults.js';

export type IconColor = ExactAxisSubset<
  typeof TEXT_COLOR,
  typeof ICON_COLOR
>[keyof typeof ICON_COLOR];

export type IconUsage = (typeof ICON_USAGE)[keyof typeof ICON_USAGE];

export type IconTitle = ReactElement<
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

export interface IconFrame<G extends GlyphSource> {
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

export type IconName =
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

export type ClosedSvgKey =
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

export type ClosedProps = {
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

type VendorProps<Props, Keys extends PropertyKey> = Props extends unknown
  ? {
      readonly [K in keyof Props as K extends Keys ? K : never]: Partial<
        Pick<Props, K>
      > extends Pick<Props, K>
        ? Props[K] | undefined
        : Exclude<Props[K], undefined>;
    } & { readonly [K in Exclude<Keys, keyof Props>]?: never }
  : never;

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
