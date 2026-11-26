import {
  Modal,
  ModalBody,
  ModalClose,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalTitle,
  ModalTrigger,
  UnicaProvider,
} from '@docouno/unica';
import { useState } from 'react';
import type { JSX } from 'react';
import { createPortal } from 'react-dom';

export default function DialogRealmFixture(): JSX.Element {
  const [host, setHost] = useState<HTMLElement | null>(null);
  const [outsideClicks, setOutsideClicks] = useState(0);
  return (
    <>
      <form id="foreign-form">
        <input name="outer" defaultValue="outside" aria-label="Outside field" />
      </form>
      <button type="button" onClick={() => setOutsideClicks((count) => count + 1)}>
        Outside action
      </button>
      <output id="outside-count">{outsideClicks}</output>
      <iframe
        title="Dialog document"
        srcDoc="<!doctype html><html lang='en'><body></body></html>"
        onLoad={(event) => setHost(event.currentTarget.contentDocument?.body ?? null)}
      />
      <iframe title="Neighbor document" srcDoc="<button type='button'>Neighbor action</button>" />
      {host &&
        createPortal(
          <UnicaProvider portalContainer={host}>
            <button type="button" id="frame-background">
              Frame background
            </button>
            <Modal>
              <ModalTrigger>Open local dialog</ModalTrigger>
              <ModalContent id="local-dialog">
                <ModalHeader>
                  <ModalTitle>Local dialog</ModalTitle>
                </ModalHeader>
                <ModalBody>
                  <input form="foreign-form" name="foreign" aria-label="Cross-document field" />
                  <form
                    id="local-form"
                    aria-label="Local form"
                    onSubmit={(event) => event.preventDefault()}
                  >
                    <input name="inner" aria-label="Local field" defaultValue="inside" />
                  </form>
                </ModalBody>
                <ModalFooter>
                  <ModalClose>Close local dialog</ModalClose>
                  <button type="submit" form="local-form" name="intent" value="commit">
                    Commit local form
                  </button>
                </ModalFooter>
              </ModalContent>
            </Modal>
          </UnicaProvider>,
          host,
        )}
      <UnicaProvider portalContainer={host}>
        <Modal>
          <ModalTrigger>Open cross-document dialog</ModalTrigger>
          <ModalContent id="foreign-dialog">
            <ModalHeader>
              <ModalTitle>Cross-document dialog</ModalTitle>
            </ModalHeader>
            <ModalFooter>
              <ModalClose>Close cross-document dialog</ModalClose>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </UnicaProvider>
    </>
  );
}
