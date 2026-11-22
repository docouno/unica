import type { SIZE, STATUS } from '../../consts.js';
import type { PassiveRootProps } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { CODE_SIZE, CODE_STATUS } from './consts.js';

export type CodeSize = ExactAxisSubset<typeof SIZE, typeof CODE_SIZE>[keyof typeof CODE_SIZE];

export type CodeStatus = ExactAxisSubset<
  typeof STATUS,
  typeof CODE_STATUS
>[keyof typeof CODE_STATUS];

export interface CodeProps extends Omit<
  PassiveRootProps<'code'>,
  'aria-label' | 'aria-labelledby'
> {
  readonly size?: CodeSize | undefined;
  readonly status?: CodeStatus | undefined;
  readonly plate?: boolean | undefined;
  readonly 'aria-label'?: never;
  readonly 'aria-labelledby'?: never;
}
