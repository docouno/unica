import type { ComponentPropsWithRef } from 'react';
import type { SIZE } from '../../consts.js';
import type { ExactAxisSubset } from '../../types.js';
import type { KBD_SIZE } from './consts.js';

export type KbdSize = ExactAxisSubset<typeof SIZE, typeof KBD_SIZE>[keyof typeof KBD_SIZE];

export interface KbdProps extends Omit<
  ComponentPropsWithRef<'kbd'>,
  'aria-label' | 'dangerouslySetInnerHTML'
> {
  readonly size?: KbdSize | undefined;
  /** Replaces the key's spoken text, for example to localize a built-in symbol. */
  readonly label?: string | undefined;
  readonly 'aria-label'?: never;
}

export interface KbdGroupProps extends Omit<
  ComponentPropsWithRef<'span'>,
  'dangerouslySetInnerHTML'
> {
  readonly size?: KbdSize | undefined;
  /** Empty strings leave a compact gap and preserve a spoken “plus”. */
  readonly separator?: string | undefined;
}
