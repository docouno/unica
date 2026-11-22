import type { ReactNode } from 'react';
import type {
  BinaryIndicatorProps,
  ToggleGroupProps,
  ToggleProps,
} from '../../internal/binary/types.js';

export interface SwitchProps extends ToggleProps {
  readonly loading?: boolean | undefined;
  readonly thumbIcon?: ReactNode | undefined;
}

export type SwitchGroupProps = ToggleGroupProps;

export interface SwitchIndicatorProps extends BinaryIndicatorProps {
  readonly loading?: boolean | undefined;
  readonly thumbIcon?: ReactNode | undefined;
}
