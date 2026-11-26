import type { ComponentPropsWithRef, ReactNode } from 'react';
import type { CheckboxGroupProps, CheckboxProps } from '../Checkbox/types.js';
import type { RadioGroupProps, RadioProps } from '../Radio/types.js';
import type { SwitchProps } from '../Switch/types.js';
import type { BinaryIndicatorProps } from '../../internal/binary/types.js';

export type ChoiceCardIndicatorPlacement = 'start' | 'end' | 'none';

type ChoiceCardSlots =
  | {
      readonly children?: never;
      readonly label?: ReactNode | undefined;
      readonly description?: ReactNode | undefined;
      readonly metadata?: ReactNode | undefined;
      readonly secondary?: ReactNode | undefined;
    }
  | {
      readonly children: ReactNode;
      readonly label?: never;
      readonly description?: never;
      readonly metadata?: never;
      readonly secondary?: never;
    };

type ChoiceCardOptions = ChoiceCardSlots & {
  readonly indicatorPlacement?: ChoiceCardIndicatorPlacement | undefined;
};

export type CheckboxCardProps = Omit<CheckboxProps, 'label' | 'description' | 'indeterminate'> &
  ChoiceCardOptions;

export type RadioCardProps = Omit<
  RadioProps,
  'label' | 'description' | 'checked' | 'defaultChecked' | 'name' | 'form' | 'required' | 'value'
> &
  ChoiceCardOptions & {
    readonly value: string;
  };

export type SwitchCardProps = Omit<SwitchProps, 'label' | 'description'> & ChoiceCardOptions;
export type CheckboxCardGroupProps = CheckboxGroupProps;
export type RadioCardGroupProps = RadioGroupProps;

export type ChoiceCardContentProps = ComponentPropsWithRef<'div'>;
export type ChoiceCardLabelProps = ComponentPropsWithRef<'span'>;
export type ChoiceCardDescriptionProps = ComponentPropsWithRef<'span'>;
export type ChoiceCardMetadataProps = ComponentPropsWithRef<'div'>;
export type ChoiceCardSecondaryProps = ComponentPropsWithRef<'div'>;

export type CheckboxCardIndicatorProps = Omit<
  BinaryIndicatorProps,
  'size' | 'checked' | 'disabled'
>;
export type RadioCardIndicatorProps = CheckboxCardIndicatorProps;
export type SwitchCardIndicatorProps = CheckboxCardIndicatorProps;
