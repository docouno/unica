import type {
  BinaryGroupProps,
  BinaryIndicatorProps,
  BinaryInputProps,
  BinaryStatus,
} from '../../internal/binary/types.js';

export interface RadioProps extends BinaryInputProps {
  readonly status?: BinaryStatus | undefined;
}

export interface RadioGroupProps extends BinaryGroupProps {
  readonly status?: BinaryStatus | undefined;
  readonly required?: boolean | undefined;
  readonly value?: string | null | undefined;
  readonly defaultValue?: string | null | undefined;
  readonly onValueChange?: ((next: string) => void) | undefined;
}

export type RadioIndicatorProps = BinaryIndicatorProps;
