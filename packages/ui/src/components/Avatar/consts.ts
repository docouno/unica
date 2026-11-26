import type { SIZE } from '../../consts.js';

export const AVATAR_SIZE: Pick<typeof SIZE, 'xs' | 's' | 'm' | 'l'> & {
  readonly '2xs': '2xs';
} = {
  '2xs': '2xs',
  xs: 'xs',
  s: 's',
  m: 'm',
  l: 'l',
} as const;
