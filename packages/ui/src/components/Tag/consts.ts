export const TAG_SIZE = {
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const TAG_STATUS = {
  neutral: 'neutral',
  accent: 'accent',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export const TAG_DESCRIPTION_ATTRIBUTES = {
  'aria-describedby': true,
  'aria-description': true,
  'aria-details': true,
} as const;
