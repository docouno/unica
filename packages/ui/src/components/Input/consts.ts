export const CONTROL_SIZE = {
  s: 's',
  m: 'm',
  l: 'l',
} as const;

export const FIELD_STATUS = {
  neutral: 'neutral',
  info: 'info',
  success: 'success',
  warning: 'warning',
  danger: 'danger',
} as const;

export const FIELD_VARIANT = {
  default: 'default',
  ghost: 'ghost',
} as const;

export const INPUT_TYPE = {
  text: 'text',
  search: 'search',
  email: 'email',
  url: 'url',
  tel: 'tel',
  password: 'password',
} as const;
