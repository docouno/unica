import { useContext } from 'react';
import type { JSX } from 'react';
import { SwitchContext } from '../../internal/binary/BinaryGroup.js';
import { BinaryInput } from '../../internal/binary/BinaryInput.js';
import { SwitchIndicator } from './SwitchIndicator.js';
import type { SwitchProps } from './types.js';

/** Renders an immediate two-state setting with optional pending feedback. */
export function Switch({ loading, thumbIcon, ...props }: SwitchProps): JSX.Element {
  const group = useContext(SwitchContext);
  return (
    <BinaryInput
      {...props}
      group={group}
      kind="switch"
      loading={loading}
      indicator={(state) => <SwitchIndicator {...state} loading={loading} thumbIcon={thumbIcon} />}
    />
  );
}
