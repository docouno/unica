import { useId, useRef, useState } from 'react';
import { Button, Stack, Text } from '@docouno/unica';
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
import { ToastCard } from '../../prototypes/toast/toast.proto.js';
import '@docouno/unica/styles.css';

export function DeleteExport({ subject = {} } = {}) {
  const receiptId = useId();
  const receiptRef = useRef(null);
  const cancelRef = useRef(null);
  const [open, setOpen] = useState(true);
  const [launched, setLaunched] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [notice, setNotice] = useState(false);
  return (
    <div
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        inlineSize: '100%',
        blockSize: 340,
      }}
    >
      <Modal open={open} onOpenChange={setOpen}>
        <Stack
          align="center"
          gap={8}
          inert={open}
          style={{ visibility: open ? 'hidden' : 'visible' }}
        >
          <ModalTrigger
            {...(!open ? subject : {})}
            variant="secondary"
            tone="neutral"
            disabled={deleted}
            onClick={() => setLaunched(true)}
          >
            Review export deletion
          </ModalTrigger>
          {deleted && (
            <Text
              ref={receiptRef}
              id={receiptId}
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
          described
          returnFocus={receiptRef}
          initialFocus={launched ? cancelRef : undefined}
        >
          <ModalHeader closeLabel={false}>
            <ModalTitle>Delete this export?</ModalTitle>
            <ModalDescription>
              The download link for the November report will stop working. The original report will
              remain available.
            </ModalDescription>
          </ModalHeader>
          <ModalFooter>
            <ModalClose ref={cancelRef}>Cancel</ModalClose>
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
        <div
          style={{
            position: 'absolute',
            insetInline: 'var(--space-12)',
            insetBlockEnd: 'var(--space-12)',
            display: 'flex',
            justifyContent: 'end',
          }}
        >
          <ToastCard
            status="success"
            title="Export deleted"
            onDismiss={() => {
              setNotice(false);
              document.getElementById(receiptId)?.focus({ preventScroll: true });
            }}
          />
        </div>
      )}
    </div>
  );
}
