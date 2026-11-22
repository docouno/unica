import type { CSSProperties, HTMLAttributes, ReactElement, ReactNode, Ref } from 'react';
import type { MARK_STATUS, SIZE } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { BADGE_SIZE, BADGE_STATUS } from './consts.js';

export type BadgeStatus = ExactAxisSubset<
  typeof MARK_STATUS,
  typeof BADGE_STATUS
>[keyof typeof BADGE_STATUS];

export type BadgeSize = ExactAxisSubset<typeof SIZE, typeof BADGE_SIZE>[keyof typeof BADGE_SIZE];

interface BadgePresentation {
  readonly status?: BadgeStatus | undefined;
  readonly size?: BadgeSize | undefined;
  readonly dot?: boolean | undefined;
  readonly iconLeft?: GlyphSource | undefined;
}

interface BadgeRootProps<T extends HTMLElement> extends Omit<
  HTMLAttributes<T>,
  'children' | 'dangerouslySetInnerHTML' | 'style'
> {
  readonly ref?: Ref<T> | undefined;
  readonly style?:
    (CSSProperties & { readonly '--badge-max-width'?: string | undefined }) | undefined;
  readonly dangerouslySetInnerHTML?: never;
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
}

export type BadgeProps = BadgePresentation &
  (
    | (BadgeRootProps<HTMLSpanElement> & {
        readonly asChild?: false | undefined;
        readonly children: ReactNode;
      })
    | (BadgeRootProps<HTMLElement> & { readonly asChild: true; readonly children: ReactElement })
  );
