import type { JSX } from 'react';
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
} from '@docouno/unica';

export default function ScrollbarDialogFixture(): JSX.Element {
  return (
    <Modal defaultOpen>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>Document history</ModalTitle>
        </ModalHeader>
        <ModalBody>
          {Array.from({ length: 24 }, (_, index) => (
            <p key={index}>Change {index + 1} is ready for review.</p>
          ))}
        </ModalBody>
        <ModalFooter>
          <button type="button">Continue</button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
