import type { ReactElement } from 'react';
import { Intake } from './Intake.js';
import type { DropzoneProps } from './types.js';
import './file-input.css';

/** Receive locally selected files from a drop target with a native picker. */
export function Dropzone(props: DropzoneProps): ReactElement {
  return <Intake {...props} layout="dropzone" />;
}
