import type { CSSProperties } from 'react';

export type DisplayStatus = 'neutral' | 'accent' | 'info' | 'success' | 'warning' | 'danger';

export function statusStyle(status: DisplayStatus): CSSProperties {
  const prefix = status === 'neutral' || status === 'accent' ? status : `status-${status}`;
  return {
    '--mark-bg': `var(--${prefix}-soft-bg)`,
    '--mark-fg': `var(--${prefix}-soft-fg)`,
    '--mark-border': `var(--${prefix}-border)`,
    '--mark-signal': `var(--${prefix}-signal)`,
  } as CSSProperties;
}
