import { useRef, useState } from 'react';
import type { JSX } from 'react';

export default function NativeFixture(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [backgroundClicks, setBackgroundClicks] = useState(0);

  return (
    <>
      <p
        data-testid="context"
        style={{ backgroundColor: 'var(--control-bg)', fontSize: 'var(--text-size-body-m)' }}
      >
        Context probe
      </p>
      <button type="button">First stop</button>
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
        onClick={() => setBackgroundClicks((clicks) => clicks + 1)}
      >
        Background
      </button>
      <output data-testid="background-clicks">{backgroundClicks}</output>
      <dialog
        ref={dialog}
        aria-label="Native dialog"
        style={{ width: '180px', height: '100px', padding: 0 }}
      >
        <button type="button">Dialog action</button>
      </dialog>
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
