import type {
  BinaryIndicatorProps,
  BinaryStatus,
  ToggleGroupProps,
  ToggleProps,
} from '../../internal/binary/types.js';

export interface CheckboxProps extends ToggleProps {
  readonly status?: BinaryStatus | undefined;
  readonly indeterminate?: boolean | undefined;
}

export interface CheckboxGroupProps extends ToggleGroupProps {
  readonly status?: BinaryStatus | undefined;
  readonly required?: boolean | undefined;
  readonly requiredMessage?: string | undefined;
}

export interface CheckboxIndicatorProps extends BinaryIndicatorProps {
  readonly indeterminate?: boolean | undefined;
}
