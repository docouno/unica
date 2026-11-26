// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
  Modal,
  ModalContent,
  ModalTitle,
  ModalTrigger,
} from '../src/index.js';

it('renders stable, collapsed triggers before a native dialog has a client portal', () => {
  expect(typeof document).toBe('undefined');
  const change = vi.fn();
  const render = (): string =>
    renderToString(
      <>
        <Modal defaultOpen onOpenChange={change}>
          <ModalTrigger>Invite</ModalTrigger>
          <ModalContent id="invite">
            <ModalTitle>Invite a reviewer</ModalTitle>
          </ModalContent>
        </Modal>
        <Drawer open onOpenChange={change}>
          <DrawerTrigger>Properties</DrawerTrigger>
          <DrawerContent>
            <DrawerTitle>Page properties</DrawerTitle>
          </DrawerContent>
        </Drawer>
      </>,
    );
  const markup = render();
  expect(render()).toBe(markup);
  expect(markup.match(/aria-expanded="false"/g)).toHaveLength(2);
  expect(markup.match(/aria-haspopup="dialog"/g)).toHaveLength(2);
  expect(markup).not.toMatch(/aria-controls|<dialog|Invite a reviewer|Page properties/);
  expect(change).not.toHaveBeenCalled();
});
