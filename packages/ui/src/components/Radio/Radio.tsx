import { useContext } from 'react';
import type { JSX } from 'react';
import { RadioContext } from '../../internal/binary/BinaryGroup.js';
import { BinaryInput } from '../../internal/binary/BinaryInput.js';
import { RadioIndicator } from './RadioIndicator.js';
import type { RadioProps } from './types.js';

/** Renders a native radio option for a RadioGroup or a named HTML radio set. */
export function Radio(props: RadioProps): JSX.Element {
  const group = useContext(RadioContext);
  return (
    <BinaryInput
      {...props}
      group={group}
      kind="radio"
      indicator={(state) => <RadioIndicator {...state} />}
    />
  );
}
