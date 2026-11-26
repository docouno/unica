import { useRef, useState } from 'react';
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
  Stack,
  Text,
  Toast,
} from '@docouno/unica';
import '@docouno/unica/styles.css';

export function DeleteExport({ subject = {} } = {}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const receiptRef = useRef<HTMLParagraphElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(true);
  const [deleted, setDeleted] = useState(false);
  const [notice, setNotice] = useState(false);

  return (
    <>
      <Modal open={open} onOpenChange={setOpen}>
        <Stack className="dialog-study-launch" data-open={open || undefined} align="center" gap={8}>
          <ModalTrigger
            {...(!open && !deleted ? subject : {})}
            ref={triggerRef}
            asChild
            disabled={deleted}
          >
            <Button variant="secondary" tone="neutral">
              Review export deletion
            </Button>
          </ModalTrigger>
          {deleted && (
            <Text
              {...subject}
              ref={receiptRef}
              tabIndex={-1}
              role="status"
              dir="auto"
              size="body-s"
              style={{ background: 'var(--bg-surface)', padding: 'var(--space-4) var(--space-8)' }}
            >
              Export deleted · November report
            </Text>
          )}
        </Stack>
        <ModalContent
          {...subject}
          role="alertdialog"
          size="s"
          width="s"
          returnFocus={deleted ? receiptRef : triggerRef}
          initialFocus={cancelRef}
        >
          <ModalHeader>
            <div>
              <ModalTitle>Delete this export?</ModalTitle>
              <ModalDescription>
                The download link for the November report will stop working. The original report
                will remain available.
              </ModalDescription>
            </div>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={cancelRef} asChild>
              <Button variant="secondary" tone="neutral">
                Cancel
              </Button>
            </ModalClose>
            <Button
              tone="danger"
              onClick={() => {
                setDeleted(true);
                setNotice(true);
                setOpen(false);
              }}
            >
              Delete export
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      {notice && (
        <div className="dialog-study-notice">
          <Toast
            status="success"
            title="Export deleted"
            onDismiss={() => {
              setNotice(false);
              receiptRef.current?.focus({ preventScroll: true });
            }}
          />
        </div>
      )}
    </>
  );
}
