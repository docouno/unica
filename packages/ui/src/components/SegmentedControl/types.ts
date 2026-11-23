import type { HTMLAttributes, Ref } from 'react';
import type { SIZE, STATUS } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { ExactAxisSubset } from '../../types.js';
import type { SEGMENTED_CONTROL_SIZE, SEGMENTED_CONTROL_STATUS } from './consts.js';

export type SegmentedControlSize = ExactAxisSubset<
  typeof SIZE,
  typeof SEGMENTED_CONTROL_SIZE
>[keyof typeof SEGMENTED_CONTROL_SIZE];
export type SegmentedControlStatus = ExactAxisSubset<
  typeof STATUS,
  typeof SEGMENTED_CONTROL_STATUS
>[keyof typeof SEGMENTED_CONTROL_STATUS];
export type SegmentedControlOrientation = 'horizontal' | 'vertical';
export type SegmentedControlWidth = 'auto' | 'full';

export type SegmentedControlOption = {
  readonly value: string;
  readonly label: string;
  readonly disabled?: boolean | undefined;
} & (
  | { readonly iconOnly: true; readonly iconLeft: GlyphSource }
  | { readonly iconOnly?: false | undefined; readonly iconLeft?: GlyphSource | undefined }
);

type OwnedAttribute =
  | 'aria-checked'
  | 'aria-disabled'
  | 'aria-invalid'
  | 'aria-orientation'
  | 'aria-readonly'
  | 'aria-required'
  | 'aria-selected'
  | 'children'
  | 'checked'
  | 'dangerouslySetInnerHTML'
  | 'defaultChecked'
  | 'defaultValue'
  | 'onChange'
  | 'onChangeCapture'
  | 'role'
  | 'tabIndex';

type GroupName =
  | { readonly 'aria-label': string; readonly 'aria-labelledby'?: string | undefined }
  | { readonly 'aria-label'?: string | undefined; readonly 'aria-labelledby': string };

export type SegmentedControlProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  OwnedAttribute | 'aria-label' | 'aria-labelledby'
> &
  GroupName & {
    readonly [K in Exclude<OwnedAttribute, 'defaultValue'>]?: never;
  } & {
    readonly ref?: Ref<HTMLDivElement> | undefined;
    readonly items: readonly SegmentedControlOption[];
    readonly value?: string | null | undefined;
    readonly defaultValue?: string | null | undefined;
    readonly onValueChange?: ((value: string) => void) | undefined;
    readonly size?: SegmentedControlSize | undefined;
    readonly orientation?: SegmentedControlOrientation | undefined;
    readonly width?: SegmentedControlWidth | undefined;
    readonly name?: string | undefined;
    readonly form?: string | undefined;
    readonly required?: boolean | undefined;
    readonly readOnly?: boolean | undefined;
    readonly disabled?: boolean | undefined;
    readonly status?: SegmentedControlStatus | undefined;
    readonly [attribute: `data-${string}`]: string | number | boolean | undefined;
  };
