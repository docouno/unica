import type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContentProps,
  DialogDescriptionProps,
  DialogFooterProps,
  DialogHeaderProps,
  DialogRootProps,
  DialogSide,
  DialogSize,
  DialogTitleProps,
  DialogTriggerProps,
  ResponsiveDialogSide,
} from '../../internal/dialog/types.js';

export type DrawerProps = DialogRootProps;
export type DrawerTriggerProps = DialogTriggerProps;
export type DrawerSize = DialogSize;
export type DrawerWidth = DialogSize;
export type DrawerSide = DialogSide;
export type DrawerResponsiveSide = ResponsiveDialogSide;

export interface DrawerContentProps extends DialogContentProps {
  readonly side?: DrawerSide | DrawerResponsiveSide | undefined;
  readonly swipeToClose?: boolean | undefined;
}

export type DrawerHeaderProps = DialogHeaderProps;
export type DrawerTitleProps = DialogTitleProps;
export type DrawerDescriptionProps = DialogDescriptionProps;
export type DrawerBodyProps = DialogBodyProps;
export type DrawerFooterProps = DialogFooterProps;
export type DrawerCloseProps = DialogCloseProps;
