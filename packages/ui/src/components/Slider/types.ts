import type { ComponentPropsWithRef, Ref } from 'react';
import type { ORIENTATION, SIZE, STATUS } from '../../consts.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { SLIDER_ORIENTATION, SLIDER_SIZE, SLIDER_STATUS } from './consts.js';

export type SliderSize = ExactAxisSubset<typeof SIZE, typeof SLIDER_SIZE>[keyof typeof SLIDER_SIZE];
export type SliderOrientation = ExactAxisSubset<
  typeof ORIENTATION,
  typeof SLIDER_ORIENTATION
>[keyof typeof SLIDER_ORIENTATION];
export type SliderStatus = ExactAxisSubset<
  typeof STATUS,
  typeof SLIDER_STATUS
>[keyof typeof SLIDER_STATUS];

export type RangeSliderValue = readonly [number, number];
export type SliderValueFormatter = (value: number) => string;
export interface SliderMark {
  readonly value: number;
  readonly label?: string | undefined;
}

type NameAndDescription = 'aria-label' | 'aria-labelledby' | 'aria-describedby' | 'aria-details';
type FormEvents =
  | 'onFocus'
  | 'onFocusCapture'
  | 'onBlur'
  | 'onBlurCapture'
  | 'onKeyDown'
  | 'onKeyDownCapture'
  | 'onKeyUp'
  | 'onKeyUpCapture';
type Input = ComponentPropsWithRef<'input'>;
type Div = ComponentPropsWithRef<'div'>;
type ThumbAttributes = Readonly<Pick<Input, 'id' | 'aria-describedby' | 'aria-details'>>;

interface SliderPresentation {
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | undefined;
  readonly size?: SliderSize | undefined;
  readonly orientation?: SliderOrientation | undefined;
  readonly status?: SliderStatus | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly showValue?: boolean | undefined;
  readonly formatValue?: SliderValueFormatter | undefined;
  readonly marks?: readonly SliderMark[] | undefined;
  readonly form?: string | undefined;
}

type RootAttributes = Readonly<
  Pick<Div, 'className' | 'style' | 'dir' | 'lang' | 'inert' | 'hidden' | 'title'>
> & {
  readonly [key: `data-${string}`]: DataAttributeValue;
};
type OwnedAttributes =
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'type'
  | 'role'
  | 'tabIndex'
  | 'required'
  | 'onChange'
  | 'onChangeCapture'
  | 'onInput'
  | 'onInputCapture'
  | 'aria-invalid'
  | 'aria-readonly'
  | 'aria-disabled'
  | 'aria-orientation'
  | 'aria-hidden'
  | 'aria-valuemin'
  | 'aria-valuemax'
  | 'aria-valuenow'
  | 'aria-valuetext'
  | 'label'
  | 'description'
  | 'preview'
  | 'previewThumb';
type Owned = { readonly [Key in OwnedAttributes]?: never };

export type SliderProps = SliderPresentation &
  RootAttributes &
  Owned &
  Readonly<Pick<Input, NameAndDescription | FormEvents | 'id' | 'ref' | 'name'>> & {
    readonly value?: number | undefined;
    readonly defaultValue?: number | undefined;
    readonly onValueChange?: ((next: number) => void) | undefined;
    readonly onValueCommit?: ((next: number) => void) | undefined;
  };

export type RangeSliderProps = SliderPresentation &
  RootAttributes &
  Owned &
  Readonly<Pick<Div, NameAndDescription | FormEvents | 'id' | 'ref'>> & {
    readonly value?: RangeSliderValue | undefined;
    readonly defaultValue?: RangeSliderValue | undefined;
    readonly onValueChange?: ((next: RangeSliderValue) => void) | undefined;
    readonly onValueCommit?: ((next: RangeSliderValue) => void) | undefined;
    readonly minStepsBetweenThumbs?: number | undefined;
    readonly names?: readonly [string, string] | undefined;
    readonly thumbLabels: readonly [string, string];
    readonly inputRefs?: readonly [Ref<HTMLInputElement>, Ref<HTMLInputElement>] | undefined;
    readonly inputProps?: readonly [ThumbAttributes, ThumbAttributes] | undefined;
  };
