import { useId, useState } from 'react';
import { Flex } from '@docouno/unica';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
} from '../../prototypes/dialog/dialog.proto.js';
import { Toast } from '@docouno/unica';
import '@docouno/unica/styles.css';

const facts = [
  ['Format', 'PDF document'],
  ['Created', 'November 12, 2026'],
  ['Access', 'People with the link'],
];

export function ExportDetails({ subject = {} } = {}) {
  const [open, setOpen] = useState(true);
  const [notified, setNotified] = useState(true);
  const hostId = useId();
  return (
    <div
      id={hostId}
      style={{
        position: 'relative',
        isolation: 'isolate',
        display: 'grid',
        placeItems: 'center',
        inlineSize: '100%',
        blockSize: 500,
      }}
    >
      <Modal open={open} onOpenChange={setOpen}>
        <div inert={open} style={{ visibility: open ? 'hidden' : 'visible' }}>
          <ModalTrigger {...(!open ? subject : {})} variant="secondary" tone="neutral">
            View export details
          </ModalTrigger>
        </div>
        <ModalContent
          {...subject}
          width="s"
          described
          dismissOnBackdrop
          notification={
            notified && (
              <Toast
                status="success"
                title="Export ready"
                onDismiss={() => {
                  setNotified(false);
                  document
                    .getElementById(hostId)
                    ?.querySelector('h2')
                    ?.focus({ preventScroll: true });
                }}
              >
                November report
              </Toast>
            )
          }
        >
          <ModalHeader closeLabel="Close export details">
            <ModalTitle tabIndex={-1}>Export details</ModalTitle>
            <ModalDescription>November report</ModalDescription>
          </ModalHeader>
          <ModalBody>
            <dl style={{ margin: 0, display: 'grid', gap: 'var(--space-12)' }}>
              {facts.map(([label, value]) => (
                <Flex
                  key={label}
                  justify="space-between"
                  wrap="wrap"
                  style={{ columnGap: 'var(--space-16)' }}
                >
                  <dt style={{ color: 'var(--fg-secondary)' }}>{label}</dt>
                  <dd style={{ margin: 0, fontWeight: 500 }}>
                    <bdi>{value}</bdi>
                  </dd>
                </Flex>
              ))}
            </dl>
          </ModalBody>
        </ModalContent>
      </Modal>
    </div>
  );
}
