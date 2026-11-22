import { useContext } from 'react';
import type { JSX } from 'react';
import { CheckboxContext } from '../../internal/binary/BinaryGroup.js';
import { BinaryInput } from '../../internal/binary/BinaryInput.js';
import { CheckboxIndicator } from './CheckboxIndicator.js';
import type { CheckboxProps } from './types.js';

/** Renders a native checkbox with an optional label, description, and mixed state. */
export function Checkbox({ indeterminate, ...props }: CheckboxProps): JSX.Element {
  const group = useContext(CheckboxContext);
  return (
    <BinaryInput
      {...props}
      group={group}
      kind="checkbox"
      indeterminate={indeterminate}
      indicator={(state) => <CheckboxIndicator {...state} indeterminate={indeterminate} />}
    />
  );
}
