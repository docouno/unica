import type { JSX } from 'react';
import { BinaryRadioGroup } from '../../internal/binary/BinaryGroup.js';
import type { RadioGroupProps } from './types.js';

/** Owns the selected value and keyboard navigation for a set of radio options. */
export function RadioGroup(props: RadioGroupProps): JSX.Element {
  return <BinaryRadioGroup {...props} />;
}
