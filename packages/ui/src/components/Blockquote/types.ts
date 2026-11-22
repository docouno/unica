import type { ReactNode } from 'react';
import type { SIZE, STATUS } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { PassiveRootProps } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { BLOCKQUOTE_SIZE, BLOCKQUOTE_STATUS } from './consts.js';

export type BlockquoteSize = ExactAxisSubset<
  typeof SIZE,
  typeof BLOCKQUOTE_SIZE
>[keyof typeof BLOCKQUOTE_SIZE];

export type BlockquoteStatus = ExactAxisSubset<
  typeof STATUS,
  typeof BLOCKQUOTE_STATUS
>[keyof typeof BLOCKQUOTE_STATUS];

export interface BlockquoteProps extends PassiveRootProps<'figure'> {
  readonly size?: BlockquoteSize | undefined;
  readonly status?: BlockquoteStatus | undefined;
  readonly attribution?: ReactNode;
  readonly citeUrl?: string | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
}
