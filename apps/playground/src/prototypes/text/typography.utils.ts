import type { CSSProperties } from 'react';
import type { TextColor, TextWeight } from './text.proto.js';

const weights = { light: 300, regular: 400, medium: 500, semibold: 600, bold: 700 } as const;
const colors: Record<TextColor, string> = {
  inherit: 'inherit',
  primary: 'var(--fg-primary)',
  secondary: 'var(--fg-secondary)',
  muted: 'var(--fg-muted)',
  subtle: 'var(--fg-subtle)',
  accent: 'var(--accent-soft-fg)',
  info: 'var(--status-info-soft-fg)',
  success: 'var(--status-success-soft-fg)',
  warning: 'var(--status-warning-soft-fg)',
  danger: 'var(--status-danger-soft-fg)',
};

export function typographyStyle(size: string, weight: TextWeight, color: TextColor): CSSProperties {
  return {
    fontSize: `var(--text-size-${size})`,
    lineHeight: `var(--text-size-${size}-lh)`,
    fontWeight: weights[weight],
    color: colors[color],
  };
}

export function validClamp(value: number | undefined): number | undefined {
  return value !== undefined && Number.isInteger(value) && value > 0 ? value : undefined;
}
