import type { ReactElement } from 'react';
import { DialogContent, DialogRoot } from '../../internal/dialog/Dialog.js';
import type { ModalContentProps, ModalProps } from './types.js';
import './modal.css';

/** Owns the visibility of a centered modal dialog. */
export function Modal(props: ModalProps): ReactElement {
  return <DialogRoot {...props} kind="modal" />;
}

/** Hosts the modal task in the browser's top layer. */
export function ModalContent({ role = 'dialog', ...props }: ModalContentProps): ReactElement {
  return <DialogContent {...props} role={role} side="center" />;
}
