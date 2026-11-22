import type { JSX } from 'react';
import { BinaryToggleGroup } from '../../internal/binary/BinaryGroup.js';
import type { SwitchGroupProps } from './types.js';

/** Groups switch inputs under a shared label and optional selection model. */
export function SwitchGroup(props: SwitchGroupProps): JSX.Element {
  return <BinaryToggleGroup {...props} kind="switch" />;
}
