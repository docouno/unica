import type { ComponentType, CSSProperties, ReactElement, Ref, SVGProps } from 'react';
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

export interface GlyphProps extends SVGProps<SVGSVGElement> {
  readonly color?: string;
  readonly size?: number | string;
  readonly weight?: 'regular';
}

export type GlyphComponent = ComponentType<GlyphProps>;

export interface IconProps {
  readonly icon: GlyphComponent;
  readonly size?: IconSize;
  readonly color?: IconColor;
  readonly directional?: boolean;
  readonly 'aria-label'?: string;
  readonly ref?: Ref<SVGSVGElement>;
  readonly className?: string;
  readonly style?: CSSProperties;
}

const colors: Record<IconColor, string> = {
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
};

// Visual prototype: production glyph adapters and naming rules belong to Wave 2.
export function Icon({
  icon: Glyph,
  size = 'inherit',
  color = 'inherit',
  directional = false,
  'aria-label': label,
  ref,
  className = '',
  style,
}: IconProps): ReactElement {
  const dimension = size === 'inherit' ? '1em' : `var(--size-${size}-icon)`;
  const name = label?.trim() || undefined;
  return (
    <Glyph
      ref={ref}
      size="1em"
      weight="regular"
      color="currentColor"
      className={`icon-proto ${className}`}
      data-directional={directional || undefined}
      focusable="false"
      aria-hidden={name ? undefined : true}
      aria-label={name}
      role={name ? 'img' : undefined}
      style={{ ...style, width: dimension, height: dimension, color: colors[color] }}
    />
  );
}

// Custom glyphs preserve their own viewBox and paint inside the square CSS frame.
export function VectorGlyph({
  size = '1em',
  weight: _weight,
  children,
  ...props
}: GlyphProps): ReactElement {
  // A custom vector owns its strokes; vendor options are not SVG attributes.
  void _weight;
  return (
    <svg width={size} height={size} fill="currentColor" {...props}>
      {children}
    </svg>
  );
}
