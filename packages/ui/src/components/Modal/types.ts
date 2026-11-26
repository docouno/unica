import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogRootProps,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
} from '../../internal/dialog/types.js';

export type ModalProps = DialogRootProps;
export type ModalTriggerProps = DialogTriggerProps;
export type ModalSize = DialogSize;
export type ModalWidth = DialogSize;

export interface ModalContentProps extends DialogContentProps {
  readonly role?: 'dialog' | 'alertdialog' | undefined;
}

export type ModalHeaderProps = DialogHeaderProps;
export type ModalTitleProps = DialogTitleProps;
export type ModalDescriptionProps = DialogDescriptionProps;
export type ModalBodyProps = DialogBodyProps;
export type ModalFooterProps = DialogFooterProps;
export type ModalCloseProps = DialogCloseProps;
