import { useRef, useState } from 'react';
import {
  Button,
  Flex,
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  Portal,
} from '@docouno/unica';
import '@docouno/unica/styles.css';
import { ToastCard } from '../../prototypes/toast/toast.proto.js';

const facts = [
  ['Format', 'PDF document'],
  ['Created', 'November 12, 2026'],
  ['Access', 'People with the link'],
];

export function ExportDetails({ subject = {} } = {}) {
  const [open, setOpen] = useState(true);
  const [notified, setNotified] = useState(true);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <div className="dialog-study-launch" data-open={open || undefined}>
        <ModalTrigger {...(!open ? subject : {})} ref={triggerRef} asChild>
          <Button variant="secondary" tone="neutral">
            View export details
          </Button>
        </ModalTrigger>
      </div>
      <ModalContent {...subject} width="s" dismissOnBackdrop returnFocus={triggerRef}>
        <ModalHeader>
          <div>
            <ModalTitle ref={titleRef}>Export details</ModalTitle>
            <ModalDescription>November report</ModalDescription>
          </div>
          <ModalClose aria-label="Close export details" />
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
        {notified && (
          <Portal>
            <div className="dialog-study-notice dialog-study-notice--modal">
              <ToastCard
                status="success"
                title="Export ready"
                onDismiss={() => {
                  setNotified(false);
                  titleRef.current?.focus({ preventScroll: true });
                }}
              >
                November report
              </ToastCard>
            </div>
          </Portal>
        )}
      </ModalContent>
    </Modal>
  );
}
