import { useRef, useState } from 'react';
import type { JSX } from 'react';
import { Switch } from '@docouno/unica';

export default function BinarySwitchFixture(): JSX.Element {
  const finish = useRef<((accepted: boolean) => void) | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [requests, setRequests] = useState<readonly boolean[]>([]);
  const [submits, setSubmits] = useState(0);
  const [disableFieldset, setDisableFieldset] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [stopKeyPropagation, setStopKeyPropagation] = useState(false);
  const [cancelNativeKey, setCancelNativeKey] = useState(false);

  async function request(next: boolean): Promise<void> {
    setMessage('');
    setRequests((previous) => [...previous, next]);
    setLoading(true);
    const accepted = await new Promise<boolean>((resolve) => {
      finish.current = resolve;
    });
    finish.current = null;
    setLoading(false);
    if (accepted) {
      setChecked(next);
    }
    setMessage(accepted ? 'Setting saved' : 'Setting could not be saved. Try again.');
  }

  return (
    <form
      aria-label="Async switches"
      onKeyDown={(event) => {
        if (stopKeyPropagation && event.key === 'Enter') {
          event.stopPropagation();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmits((count) => count + 1);
      }}
    >
      <fieldset disabled={disableFieldset}>
        <Switch
          label="Delivery reminders"
          description="Change when reminders arrive."
          name="reminders"
          value="enabled"
          checked={checked}
          loading={loading}
          readOnly={readOnly}
          aria-describedby="async-result"
          thumbIcon={
            <svg data-testid="async-glyph" viewBox="0 0 16 16">
              <circle cx="8" cy="8" r="4" fill="currentColor" />
            </svg>
          }
          onKeyDown={(event) => {
            if (cancelNativeKey && event.key === 'Enter') {
              event.nativeEvent.preventDefault();
              setCancelNativeKey(false);
            }
          }}
          onCheckedChange={(next) => {
            request(next).catch((error: unknown) => console.error(error));
          }}
        />
      </fieldset>
      <button type="button" onClick={() => finish.current?.(true)}>
        Resolve success
      </button>
      <button type="button" onClick={() => finish.current?.(false)}>
        Resolve failure
      </button>
      <button type="button" onClick={() => setReadOnly(!readOnly)}>
        Toggle read only
      </button>
      <button type="button" onClick={() => setStopKeyPropagation(true)}>
        Stop key propagation
      </button>
      <button type="button" onClick={() => setCancelNativeKey(true)}>
        Cancel next native key
      </button>
      <button type="button" onClick={() => setDisableFieldset(!disableFieldset)}>
        Toggle switch fieldset
      </button>
      <button type="submit">Submit async form</button>
      <p id="async-result" role="status">
        {message}
      </p>
      <span hidden data-testid="async-requests">
        {JSON.stringify(requests)}
      </span>
      <span hidden data-testid="async-submits">
        {submits}
      </span>
    </form>
  );
}
