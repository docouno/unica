import type { ComponentPropsWithRef } from 'react';
import type { ControlSize, FieldStatus, FieldVariant } from '../../core/forms/fieldAxes.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { INPUT_TYPE } from './consts.js';

type InputType = keyof typeof INPUT_TYPE;
type InapplicableAttribute =
  | 'accept'
  | 'alt'
  | 'capture'
  | 'checked'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'defaultChecked'
  | 'formAction'
  | 'formEncType'
  | 'formMethod'
  | 'formNoValidate'
  | 'formTarget'
  | 'height'
  | 'max'
  | 'min'
  | 'src'
  | 'step';

export interface InputProps
  extends
    Omit<
      ComponentPropsWithRef<'input'>,
      InapplicableAttribute | 'defaultValue' | 'prefix' | 'size' | 'type' | 'value' | 'width'
    >,
    Readonly<Partial<Record<InapplicableAttribute, never>>> {
  readonly [key: `data-${string}`]: DataAttributeValue;
  readonly type?: InputType | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly value?: string | undefined;
  readonly defaultValue?: string | undefined;
  readonly iconLeft?: GlyphSource | undefined;
  readonly iconRight?: GlyphSource | undefined;
  readonly prefix?: string | undefined;
  readonly suffix?: string | undefined;
  readonly clearable?: boolean | undefined;
  readonly clearLabel?: string | undefined;
  readonly onClear?: (() => void) | undefined;
  readonly loading?: boolean | undefined;
}
