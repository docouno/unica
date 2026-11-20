import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { createPortal } from 'react-dom';

const contextStyle = {
  backgroundColor: 'var(--control-bg)',
  fontSize: 'var(--text-size-body-m)',
};

export default function NativeFixture(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [backgroundClicks, setBackgroundClicks] = useState(0);

  function recordBackgroundClick(): void {
    setBackgroundClicks((clicks) => clicks + 1);
  }

  return (
    <>
      <p data-testid="context" style={contextStyle}>
        Context probe
      </p>
      <button type="button" onClick={recordBackgroundClick}>
        First stop
      </button>
      <label>
        <input type="radio" name="choice" defaultChecked />
        First choice
      </label>
      <label>
        <input type="radio" name="choice" />
        Second choice
      </label>
      <button type="button" onClick={() => dialog.current?.showModal()}>
        Open dialog
      </button>
      <button
        type="button"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '127.5px',
          height: '40px',
        }}
        onClick={recordBackgroundClick}
      >
        Background
      </button>
      <output data-testid="background-clicks">{backgroundClicks}</output>
      {createPortal(
        <dialog
          ref={dialog}
          aria-label="Native dialog"
          data-testid="portal-context"
          style={{ ...contextStyle, width: '180px', height: '100px', padding: 0 }}
        >
          <button type="button">Dialog action</button>
        </dialog>,
        document.body,
      )}
      <form aria-label="Native form">
        <label>
          Answer
          <input name="answer" defaultValue="original" />
        </label>
        <input type="hidden" name="answer" value="fixed" />
        <button type="submit" name="action" value="save">
          Submit form
        </button>
      </form>
    </>
  );
}
