import type { ReactElement } from 'react';
import { Action } from './Action.js';
import type { ButtonProps } from './types.js';
import './button.css';

/** Renders a labeled action on a native button or a composed navigation link. */
export function Button(props: ButtonProps): ReactElement {
  return <Action {...props} square={false} />;
}
