import type { ComponentPropsWithRef, ReactElement, ReactNode } from 'react';
import type { LinkSize } from '../../core/defaults.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { LINK_TONE, LINK_UNDERLINE } from './consts.js';

export type { LinkSize } from '../../core/defaults.js';

export type LinkTone = (typeof LINK_TONE)[keyof typeof LINK_TONE];
export type LinkUnderline = (typeof LINK_UNDERLINE)[keyof typeof LINK_UNDERLINE];

type AnchorProps = ComponentPropsWithRef<'a'>;
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

type LinkDestination =
  | {
      readonly asChild: true;
      readonly href?: never;
      readonly disabled?: boolean | undefined;
      readonly children: ReactElement;
    }
  | {
      readonly asChild?: false | undefined;
      readonly href: string;
      readonly disabled?: boolean | undefined;
      readonly children?: ReactNode;
    }
  | {
      readonly asChild?: false | undefined;
      readonly href?: string | undefined;
      readonly disabled: true;
      readonly children?: ReactNode;
    };

export type LinkProps = LinkOptions &
  LinkDestination &
  Omit<AnchorProps, 'href' | 'children' | OwnedAttribute> & {
    readonly [Key in OwnedAttribute]?: never;
  };
