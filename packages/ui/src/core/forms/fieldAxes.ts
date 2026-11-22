import type { SIZE, STATUS } from '../../consts.js';

export type ControlSize = (typeof SIZE)['s' | 'm' | 'l'];
export type FieldStatus = (typeof STATUS)['neutral' | 'info' | 'success' | 'warning' | 'danger'];
export type FieldVariant = 'default' | 'ghost';
