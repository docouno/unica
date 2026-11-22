export const SIZE = {
  xs: 'xs',
  s: 's',
  m: 'm',
  l: 'l',
  xl: 'xl',
  inherit: 'inherit',
} as const;

export const STATUS = {
  neutral: 'neutral',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
  inherit: 'inherit',
} as const;

export const MARK_STATUS = {
  neutral: 'neutral',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export const TEXT_COLOR = {
  inherit: 'inherit',
  primary: 'primary',
  secondary: 'secondary',
  muted: 'muted',
  subtle: 'subtle',
  disabled: 'disabled',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export const TYPOGRAPHY_STEP = {
  'display-l': 'display-l',
  'display-m': 'display-m',
  'display-s': 'display-s',
  'heading-xl': 'heading-xl',
  'heading-l': 'heading-l',
  'heading-m': 'heading-m',
  'heading-s': 'heading-s',
  'body-l': 'body-l',
  'body-m': 'body-m',
  'body-s': 'body-s',
  'body-xs': 'body-xs',
  'caption-l': 'caption-l',
  'caption-m': 'caption-m',
  'caption-s': 'caption-s',
} as const;

export const TYPOGRAPHY_WEIGHT = {
  light: 'light',
  regular: 'regular',
  medium: 'medium',
  semibold: 'semibold',
  bold: 'bold',
} as const;

export const TEXT_ALIGN = {
  start: 'start',
  center: 'center',
  end: 'end',
} as const;

export const SPACING = [0, 2, 4, 8, 12, 16, 24, 32, 48, 64] as const;

export const BREAKPOINT = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
  wide: 'wide',
} as const;
