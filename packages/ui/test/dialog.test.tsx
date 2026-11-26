import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, StrictMode } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Button,
  Drawer,
  DrawerContent,
  DrawerTrigger,
  Modal,
  ModalContent,
  ModalTrigger,
  UnicaProvider,
} from '../src/index.js';

afterEach(cleanup);

it('publishes one closed carrier to both refs and all triggers only after the portal host exists', () => {
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRef<HTMLDialogElement>();
  const content = createRef<HTMLDialogElement>();
  const trigger = createRef<HTMLButtonElement>();
  const change = vi.fn();
  const view = (container: HTMLElement | null, id: string) => (
    <StrictMode>
      <UnicaProvider portalContainer={container}>
        <Drawer ref={root} onOpenChange={change}>
          <DrawerTrigger ref={trigger}>Toolbar</DrawerTrigger>
          <DrawerTrigger asChild>
            <Button>Another source</Button>
          </DrawerTrigger>
          <DrawerContent ref={content} id={id} side={{ narrow: 'bottom', wide: 'end' }}>
            <input aria-label="Draft" />
          </DrawerContent>
        </Drawer>
      </UnicaProvider>
    </StrictMode>
  );
  const { rerender, unmount } = render(view(null, 'details'));
  const toolbar = screen.getByRole('button', { name: 'Toolbar' });
  const another = screen.getByRole('button', { name: 'Another source' });
  expect(root.current).toBeNull();
  expect(trigger.current).toBe(toolbar);
  expect(toolbar.hasAttribute('aria-controls')).toBe(false);
  expect(another.getAttribute('aria-expanded')).toBe('false');

  rerender(view(host, 'details'));
  const carrier = root.current;
  expect(carrier).toBe(content.current);
  expect(carrier).toBe(host.querySelector('dialog'));
  expect(carrier?.childElementCount).toBe(0);
  expect(toolbar.getAttribute('aria-controls')).toBe('details');
  expect(another.getAttribute('aria-controls')).toBe('details');
  expect(toolbar.getAttribute('aria-haspopup')).toBe('dialog');

  rerender(view(host, 'changed'));
  expect(root.current).toBe(carrier);
  expect(toolbar.getAttribute('aria-controls')).toBe('changed');
  expect(another.getAttribute('aria-controls')).toBe('changed');
  expect(change).not.toHaveBeenCalled();
  unmount();
  expect(root.current).toBeNull();
  expect(content.current).toBeNull();
  expect(trigger.current).toBeNull();
  host.remove();
});

it('honors vetoes and inherited disabled state and leaves a refused controlled open closed', () => {
  const change = vi.fn();
  render(
    <Modal open={false} defaultOpen onOpenChange={change}>
      <fieldset disabled>
        <ModalTrigger asChild>
          <Button>Inherited disabled</Button>
        </ModalTrigger>
      </fieldset>
      <ModalTrigger onClick={(event) => event.preventDefault()}>Prevented</ModalTrigger>
      <ModalTrigger asChild>
        <Button onClick={(event) => event.preventDefault()}>Child veto</Button>
      </ModalTrigger>
      <ModalTrigger asChild>
        <a href="#target">Open</a>
      </ModalTrigger>
      <ModalContent id="target" aria-label="Details" />
    </Modal>,
  );
  for (const name of ['Inherited disabled', 'Prevented', 'Child veto']) {
    fireEvent.click(screen.getByRole('button', { name }));
  }
  const link = screen.getByRole('link', { name: 'Open' });
  expect(fireEvent.click(link, { metaKey: true })).toBe(true);
  expect(change).not.toHaveBeenCalled();
  expect(fireEvent.click(link)).toBe(false);
  expect(change).toHaveBeenCalledExactlyOnceWith(true);
  expect(link.getAttribute('aria-expanded')).toBe('false');
  expect(document.getElementById('target')?.hasAttribute('open')).toBe(false);
});
