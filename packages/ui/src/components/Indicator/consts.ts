export const INDICATOR_POSITION = {
  'top-start': 'top-start',
  'top-end': 'top-end',
  'bottom-start': 'bottom-start',
  'bottom-end': 'bottom-end',
} as const;

export const INDICATOR_STATUS = {
  neutral: 'neutral',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export const INDICATOR_SIZE = {
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const INDICATOR_OVERLAP = {
  rectangular: 'rectangular',
  circular: 'circular',
} as const;

export const INDICATOR_WIDTH = {
  auto: 'auto',
  full: 'full',
} as const;
