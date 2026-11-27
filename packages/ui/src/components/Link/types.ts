import type { AnchorDestination, AnchorProps } from '../../core/anchor.js';
import type { LinkSize } from '../../core/defaults.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { LINK_TONE, LINK_UNDERLINE } from './consts.js';

export type { LinkSize } from '../../core/defaults.js';

export type LinkTone = (typeof LINK_TONE)[keyof typeof LINK_TONE];
export type LinkUnderline = (typeof LINK_UNDERLINE)[keyof typeof LINK_UNDERLINE];

type OwnedAttribute = 'aria-disabled' | 'dangerouslySetInnerHTML';

interface LinkOptions {
  readonly tone?: LinkTone | undefined;
  readonly underline?: LinkUnderline | undefined;
  readonly size?: LinkSize | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
  readonly external?: boolean | undefined;
  readonly newTabHint?: string | undefined;
}

export type LinkProps = LinkOptions &
  AnchorDestination &
  Omit<AnchorProps, 'href' | 'children' | OwnedAttribute> & {
    readonly [Key in OwnedAttribute]?: never;
  };
