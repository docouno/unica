import { useState } from 'react';
import {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../../prototypes/dialog/dialog.proto.js';
import '@docouno/unica/styles.css';

export function ReleaseReview({
  contentProps = {},
  subject = {},
  pinned = false,
  onOpenChange = (open = false) => console.log(open),
} = {}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        inlineSize: '100%',
        blockSize: 320,
      }}
    >
      <Modal
        open={pinned || open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange(next);
        }}
      >
        {!pinned && (
          <div inert={open} style={{ visibility: open ? 'hidden' : 'visible' }}>
            <ModalTrigger {...(!open ? subject : {})} variant="secondary">
              Review release
            </ModalTrigger>
          </div>
        )}
        <ModalContent {...subject} {...contentProps} inactive={pinned} described>
          <ModalHeader>
            <ModalTitle>Release summary</ModalTitle>
            <ModalDescription>Export links expire in 30 days.</ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose>Done</ModalClose>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
}
