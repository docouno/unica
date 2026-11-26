import type {
  AriaAttributes,
  CSSProperties,
  HTMLAttributes,
  ReactNode,
  Ref,
  RefObject,
} from 'react';
import type { MARK_STATUS, SIZE } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { TAG_DESCRIPTION_ATTRIBUTES, TAG_SIZE, TAG_STATUS } from './consts.js';

export type TagSize = ExactAxisSubset<typeof SIZE, typeof TAG_SIZE>[keyof typeof TAG_SIZE];
export type TagStatus = ExactAxisSubset<
  typeof MARK_STATUS,
  typeof TAG_STATUS
>[keyof typeof TAG_STATUS];

type RichLabel = Exclude<ReactNode, boolean | null | string | undefined>;

type TagLabel<Key extends 'children' | 'label'> =
  | ({ readonly [Name in Key]: string } & { readonly textValue?: string | undefined })
  | ({ readonly [Name in Key]: RichLabel } & { readonly textValue: string });

type ControlledAriaProp = Exclude<keyof AriaAttributes, keyof typeof TAG_DESCRIPTION_ATTRIBUTES>;

type ClosedRootProp =
  | 'accessKey'
  | ControlledAriaProp
  | 'autoFocus'
  | 'contentEditable'
  | 'dangerouslySetInnerHTML'
  | 'defaultChecked'
  | 'defaultValue'
  | 'focusable'
  | 'is'
  | 'onAuxClick'
  | 'onAuxClickCapture'
  | 'onClick'
  | 'onClickCapture'
  | 'onDoubleClick'
  | 'onDoubleClickCapture'
  | 'popover'
  | 'role'
  | 'tabIndex'
  | 'title';

type TagRoot<Element extends HTMLElement> = Omit<
  HTMLAttributes<Element>,
  ClosedRootProp | 'children' | 'style'
> & {
  readonly [Name in ClosedRootProp]?: never;
} & {
  readonly ref?: Ref<Element> | undefined;
  readonly previewState?: never;
  readonly 'data-preview'?: never;
  readonly [name: `data-${string}`]: string | number | boolean | undefined;
  readonly [name: `data-unica-tag-${string}`]: never;
  readonly [name: `data-unica-mark-${string}`]: never;
};

interface TagPresentation {
  readonly status?: TagStatus | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly removeIcon?: GlyphSource | undefined;
  readonly disabled?: boolean | undefined;
  readonly loading?: boolean | undefined;
  readonly removeLabel: string;
}

export type TagProps = TagRoot<HTMLSpanElement> &
  TagPresentation &
  TagLabel<'children'> & {
    readonly style?:
      (CSSProperties & { readonly '--tag-max-width'?: string | undefined }) | undefined;
    readonly size?: TagSize | undefined;
    readonly onRemove: () => void;
    readonly removeRef?: Ref<HTMLButtonElement> | undefined;
    readonly removeTabIndex?: 0 | -1 | undefined;
  };

export type TagGroupItem = TagPresentation &
  TagLabel<'label'> & {
    readonly id: string;
  };

export interface TagGroupMessages {
  readonly empty: string;
  readonly more: (hiddenCount: number) => string;
  readonly less: string;
  readonly moreLabel: (hiddenCount: number) => string;
  readonly lessLabel: string;
  readonly removed: (labels: readonly string[]) => string;
}

export type TagGroupProps = Omit<
  TagRoot<HTMLDivElement>,
  'aria-label' | 'aria-labelledby' | 'onChange'
> &
  (
    | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
    | { readonly 'aria-labelledby': string; readonly 'aria-label'?: string | undefined }
  ) & {
    readonly children?: never;
    readonly style?:
      (CSSProperties & { readonly '--tag-group-gap'?: string | undefined }) | undefined;
    readonly items: readonly TagGroupItem[];
    readonly onRemove: (id: string) => void;
    readonly size?: TagSize | undefined;
    readonly disabled?: boolean | undefined;
    readonly maxVisible?: number | undefined;
    readonly expanded?: boolean | undefined;
    readonly defaultExpanded?: boolean | undefined;
    readonly onExpandedChange?: ((expanded: boolean) => void) | undefined;
    readonly emptyFocusRef?: RefObject<HTMLElement | null> | undefined;
    readonly messages?: Partial<TagGroupMessages> | undefined;
  };
