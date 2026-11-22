import type { JSX } from 'react';
import { BinaryToggleGroup } from '../../internal/binary/BinaryGroup.js';
import type { CheckboxGroupProps } from './types.js';

/** Groups checkbox inputs under a shared label and optional selection model. */
export function CheckboxGroup(props: CheckboxGroupProps): JSX.Element {
  return <BinaryToggleGroup {...props} kind="checkbox" />;
}
