import type { ReactElement } from 'react';
import { Intake } from './Intake.js';
import type { FileInputProps } from './types.js';
import './file-input.css';

/** Choose local files from a compact form control or inspector. */
export function FileInput(props: FileInputProps): ReactElement {
  return <Intake {...props} layout="file-input" />;
}
