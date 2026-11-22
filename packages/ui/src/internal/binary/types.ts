import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { SIZE, STATUS } from '../../consts.js';
import type { PassiveIndicatorProps } from '../../core/passiveRoot.js';

export type BinaryKind = 'checkbox' | 'radio' | 'switch';
export type BinarySize = (typeof SIZE)['s' | 'm' | 'l'];
export type BinaryStatus = (typeof STATUS)['neutral' | 'danger'];

export type BinaryInputProps = Omit<
  ComponentPropsWithRef<'input'>,
  | 'aria-checked'
  | 'checked'
  | 'children'
  | 'dangerouslySetInnerHTML'
  | 'defaultChecked'
  | 'defaultValue'
  | 'readOnly'
  | 'role'
  | 'size'
  | 'type'
  | 'value'
> & {
  readonly checked?: boolean | undefined;
  readonly defaultChecked?: boolean | undefined;
  readonly value?: string | undefined;
  readonly label?: ReactNode | undefined;
  readonly description?: ReactNode | undefined;
  readonly size?: BinarySize | undefined;
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

export interface ToggleProps extends BinaryInputProps {
  readonly readOnly?: boolean | undefined;
  readonly onCheckedChange?: ((next: boolean) => void) | undefined;
}

export type BinaryGroupProps = Omit<
  ComponentPropsWithRef<'div'>,
  'defaultValue' | 'dangerouslySetInnerHTML' | 'role'
> & {
  readonly name?: string | undefined;
  readonly form?: string | undefined;
  readonly size?: BinarySize | undefined;
  readonly disabled?: boolean | undefined;
  readonly readOnly?: boolean | undefined;
  readonly orientation?: 'vertical' | 'horizontal' | undefined;
  readonly [data: `data-${string}`]: string | number | boolean | undefined;
};

export interface ToggleGroupProps extends BinaryGroupProps {
  readonly value?: readonly string[] | undefined;
  readonly defaultValue?: readonly string[] | undefined;
  readonly onValueChange?: ((next: string[]) => void) | undefined;
}

export interface BinaryIndicatorProps extends Omit<
  PassiveIndicatorProps<'span'>,
  'aria-hidden' | 'aria-label' | 'aria-labelledby' | 'inert'
> {
  readonly size?: BinarySize | undefined;
  readonly checked?: boolean | undefined;
  readonly disabled?: boolean | undefined;
}
