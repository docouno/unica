import {
  Button,
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '@docouno/unica';
import type { ModalContentProps, ModalProps } from '@docouno/unica';
import '@docouno/unica/styles.css';
import { useRef, useState } from 'react';

export function ReleaseReview({
  contentProps = {},
  rootProps = {},
  subject,
}: {
  readonly contentProps?: Pick<ModalContentProps, 'size' | 'width' | 'dismissOnBackdrop'>;
  readonly rootProps?: Omit<ModalProps, 'children'>;
  readonly subject?: { readonly 'data-wb-subject': '' };
} = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [uncontrolledOpen, setUncontrolledOpen] = useState(rootProps.defaultOpen ?? false);
  const open = rootProps.open ?? uncontrolledOpen;
  return (
    <Modal
      {...rootProps}
      onOpenChange={(next) => {
        setUncontrolledOpen(next);
        rootProps.onOpenChange?.(next);
      }}
    >
      <div className="dialog-study-launch" data-open={open || undefined}>
        <ModalTrigger ref={triggerRef} asChild {...(!open ? subject : {})}>
          <Button variant="secondary" tone="neutral">
            Review release
          </Button>
        </ModalTrigger>
      </div>
      <ModalContent
        {...(open ? subject : {})}
        {...contentProps}
        returnFocus={triggerRef}
        data-dialog-study-pinned={rootProps.open === true ? '' : undefined}
      >
        <ModalHeader>
          <div>
            <ModalTitle data-dialog-study-title="">Release summary</ModalTitle>
            <ModalDescription>Export links expire in 30 days.</ModalDescription>
          </div>
          <ModalClose />
        </ModalHeader>
        <ModalFooter>
          <ModalClose asChild>
            <Button variant="secondary" tone="neutral">
              Done
            </Button>
          </ModalClose>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
