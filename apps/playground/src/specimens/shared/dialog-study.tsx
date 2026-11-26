import {
  Button,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@docouno/unica';
import { useRef } from 'react';
import type { ReactElement, ReactNode, RefObject } from 'react';
import { OverlayExampleFrame } from '../../examples/OverlayExampleFrame.js';
import type { PreviewContext } from '../../workbench/types.js';
import './dialog-study.css';

export function DialogStudy({
  ctx,
  height,
  title,
  children,
}: {
  readonly ctx: PreviewContext;
  readonly height: number;
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <OverlayExampleFrame ctx={ctx} title={title} height={height} modal>
      <div className="dialog-study">{children}</div>
    </OverlayExampleFrame>
  );
}

export function DiscardChanges({
  open,
  onOpenChange,
  onDiscard,
  returnFocus,
  children,
}: {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onDiscard: () => void;
  readonly returnFocus: RefObject<HTMLElement | null>;
  readonly children: ReactNode;
}): ReactElement {
  const keepEditing = useRef<HTMLButtonElement>(null);
  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent
        role="alertdialog"
        width="s"
        size="s"
        className="dialog-discard-confirmation"
        initialFocus={keepEditing}
        returnFocus={returnFocus}
      >
        <ModalHeader>
          <div>
            <ModalTitle>Discard unsaved changes?</ModalTitle>
            <ModalDescription>{children}</ModalDescription>
          </div>
        </ModalHeader>
        <ModalFooter>
          <ModalClose ref={keepEditing} asChild>
            <Button variant="secondary" tone="neutral">
              Keep editing
            </Button>
          </ModalClose>
          <Button tone="danger" onClick={onDiscard}>
            Discard changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
