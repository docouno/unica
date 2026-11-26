import type { ComponentPropsWithRef } from 'react';
import type { ControlSize, FieldStatus, FieldVariant } from '../../core/forms/fieldAxes.js';
import type { DataAttributeValue } from '../../core/passiveRoot.js';

type InapplicableAttribute =
  | 'accept'
  | 'alt'
  | 'aria-valuemax'
  | 'aria-valuemin'
  | 'aria-valuenow'
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
  | 'is'
  | 'maxLength'
  | 'minLength'
  | 'multiple'
  | 'pattern'
  | 'role'
  | 'src'
  | 'type';

export interface NumberInputProps
  extends
    Omit<
      ComponentPropsWithRef<'input'>,
      | InapplicableAttribute
      | 'defaultValue'
      | 'max'
      | 'min'
      | 'prefix'
      | 'size'
      | 'step'
      | 'value'
      | 'width'
    >,
    Readonly<Partial<Record<InapplicableAttribute, never>>> {
  readonly [key: `data-${string}`]: DataAttributeValue;
  readonly value?: number | '' | undefined;
  readonly defaultValue?: number | '' | undefined;
  readonly onValueChange?: ((value: number | '') => void) | undefined;
  readonly min?: number | undefined;
  readonly max?: number | undefined;
  readonly step?: number | 'any' | undefined;
  readonly size?: ControlSize | undefined;
  readonly variant?: FieldVariant | undefined;
  readonly status?: FieldStatus | undefined;
  readonly width?: 'auto' | 'full' | undefined;
  readonly prefix?: string | undefined;
  readonly suffix?: string | undefined;
  readonly decrementLabel?: string | undefined;
  readonly incrementLabel?: string | undefined;
  readonly loading?: boolean | undefined;
}
