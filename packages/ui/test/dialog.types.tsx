import { createRef } from 'react';
import type { ReactElement } from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../src/index.js';
import type {
  DrawerContentProps,
  DrawerResponsiveSide,
  DrawerSize,
  DrawerWidth,
  ModalContentProps,
  ModalSize,
  ModalWidth,
} from '../src/server.js';

export function dialogTypeCases(
  modal: ModalContentProps,
  drawer: DrawerContentProps,
  side: DrawerResponsiveSide,
  modalWidth: ModalWidth,
  modalSize: ModalSize,
  drawerWidth: DrawerWidth,
  drawerSize: DrawerSize,
): ReactElement {
  // @ts-expect-error Only the root can control open.
  const openContent = <ModalContent open />;
  // @ts-expect-error Drawer always has dialog semantics.
  const alertDrawer = <DrawerContent role="alertdialog" />;
  // @ts-expect-error Edge names use logical inline sides.
  const physicalRight = <DrawerContent side="right" />;
  // @ts-expect-error Close cannot submit a form implicitly.
  const closeSubmit = <DrawerClose type="submit" />;
  // @ts-expect-error Native parts expose the corresponding DOM ref.
  const wrongRef = <ModalTrigger ref={createRef<HTMLAnchorElement>()} />;
  // @ts-expect-error Trigger has to attach its props and ref to one element.
  const invalidSlot = <DrawerTrigger asChild>Open</DrawerTrigger>;
  void [openContent, alertDrawer, physicalRight, closeSubmit, wrongRef, invalidSlot];

  const dialogRef = createRef<HTMLDialogElement>();
  const inputRef = createRef<HTMLInputElement>();
  return (
    <>
      <Modal ref={dialogRef}>
        <ModalTrigger asChild>
          <Button>Open</Button>
        </ModalTrigger>
        <ModalContent
          {...modal}
          ref={dialogRef}
          width={modalWidth}
          size={modalSize}
          initialFocus={inputRef}
          role="alertdialog"
        >
          <ModalHeader>
            <ModalTitle ref={createRef<HTMLHeadingElement>()}>Confirm</ModalTitle>
            <ModalDescription ref={createRef<HTMLParagraphElement>()}>Read first</ModalDescription>
            <ModalClose ref={createRef<HTMLButtonElement>()} />
          </ModalHeader>
          <ModalBody ref={createRef<HTMLDivElement>()}>
            <input ref={inputRef} />
          </ModalBody>
          <ModalFooter>
            <ModalClose asChild>
              <Button>Cancel</Button>
            </ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
      <Drawer>
        <DrawerTrigger>Open</DrawerTrigger>
        <DrawerContent
          {...drawer}
          width={drawerWidth}
          size={drawerSize}
          side={side}
          swipeToClose={false}
        >
          <DrawerHeader>
            <DrawerTitle>Details</DrawerTitle>
            <DrawerDescription>Read first</DrawerDescription>
            <DrawerClose />
          </DrawerHeader>
          <DrawerBody>Content</DrawerBody>
          <DrawerFooter>
            <DrawerClose>Cancel</DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
