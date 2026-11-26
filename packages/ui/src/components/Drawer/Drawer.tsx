import type { ReactElement } from 'react';
import { DialogContent, DialogRoot } from '../../internal/dialog/Dialog.js';
import type { DrawerContentProps, DrawerProps } from './types.js';
import './drawer.css';

/** Owns the visibility of an edge-attached modal dialog. */
export function Drawer(props: DrawerProps): ReactElement {
  return <DialogRoot {...props} kind="drawer" />;
}

/** Hosts a modal panel attached to a logical inline or physical block edge. */
export function DrawerContent({
  side = 'end',
  swipeToClose = true,
  ...props
}: DrawerContentProps): ReactElement {
  return <DialogContent {...props} role="dialog" side={side} swipeToClose={swipeToClose} />;
}
