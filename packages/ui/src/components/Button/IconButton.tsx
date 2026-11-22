import type { ReactElement } from 'react';
import { Action } from './Action.js';
import type { IconButtonProps } from './types.js';
import './button.css';

/** Renders a square, explicitly named action with one decorative icon. */
export function IconButton(props: IconButtonProps): ReactElement {
  return <Action {...props} square />;
}
