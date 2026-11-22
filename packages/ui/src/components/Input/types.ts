import type { ComponentPropsWithRef } from 'react';
import type { SIZE, STATUS } from '../../consts.js';
import type { GlyphSource } from '../../core/glyph.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';
import type { ExactAxisSubset } from '../../types.js';
import type { CONTROL_SIZE, FIELD_STATUS, FIELD_VARIANT, INPUT_TYPE } from './consts.js';

export type ControlSize = ExactAxisSubset<
  typeof SIZE,
  typeof CONTROL_SIZE
>[keyof typeof CONTROL_SIZE];
export type FieldStatus = ExactAxisSubset<
  typeof STATUS,
  typeof FIELD_STATUS
>[keyof typeof FIELD_STATUS];
export type FieldVariant = keyof typeof FIELD_VARIANT;

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
