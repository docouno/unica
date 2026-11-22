import { Alert } from '@docouno/unica';
import { useRef, useState } from 'react';
import type { JSX } from 'react';

const exitStyle = { transition: 'display 10s allow-discrete, overlay 10s allow-discrete' };

export default function AlertVisibilityFixture(): JSX.Element {
  const [show, setShow] = useState(false);
  const [name, setName] = useState('initial');
  const dialog = useRef<HTMLDialogElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  return (
    <>
      <button type="button" onClick={() => setName('latest')}>
        Update hidden messages
      </button>
      <button type="button" onClick={() => setShow((value) => !value)}>
        Toggle section
      </button>
      <button type="button" onClick={() => dialog.current?.showModal()}>
        Open dialog
      </button>
      <button type="button" onClick={() => popover.current?.showPopover()}>
        Open popover
      </button>
      <section hidden={!show} data-testid="section-alert">
        <Alert status="info">Section result: {name}.</Alert>
      </section>
      <dialog ref={dialog} data-testid="dialog-alert" style={exitStyle}>
        <Alert status="danger">Dialog result: {name}.</Alert>
        <button type="button" onClick={() => dialog.current?.close()}>
          Close dialog
        </button>
      </dialog>
      <div ref={popover} popover="manual" data-testid="popover-alert" style={exitStyle}>
        <Alert status="success">Popover result: {name}.</Alert>
        <button type="button" onClick={() => popover.current?.hidePopover()}>
          Close popover
        </button>
      </div>
    </>
  );
}
