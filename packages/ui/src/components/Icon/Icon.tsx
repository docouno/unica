import { Children, Fragment, isValidElement, use } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { useComponentDefaults } from '../../core/UnicaProvider.js';
import { cx } from '../../core/cx.js';
import { isGlyphDefinition, renderGlyph } from '../../core/glyph.js';
import type { GlyphSource, GlyphSvgProps } from '../../core/glyph.js';
import { IconAdapterContext } from '../../core/icon-adapter.js';
import type {
  ClosedProps,
  ClosedSvgKey,
  IconFrame,
  IconName,
  IconProps,
  IconSize,
  IconTitle,
} from './types.js';
import './icon.css';

export type { IconColor, IconProps, IconSize, IconUsage } from './types.js';

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

/**
 * Renders a single non-interactive vector glyph through the configured `UnicaProvider` adapter
 * or a pinned `defineGlyph` descriptor.
 */
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
  const providerAdapter = isGlyphDefinition(icon) ? 'native' : use(IconAdapterContext);
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
    className: cx('unica-icon', className),
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
