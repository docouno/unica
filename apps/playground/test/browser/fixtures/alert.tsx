import {
  Alert,
  AlertActions,
  AlertClose,
  AlertDescription,
  AlertTitle,
  Code,
  Link,
} from '@docouno/unica';
import { StrictMode, useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

function FeedbackForm(): JSX.Element {
  const [message, setMessage] = useState('Draft A');
  const [show, setShow] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [urgent, setUrgent] = useState(true);
  const [accept, setAccept] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [requests, setRequests] = useState(0);
  const [submissions, setSubmissions] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const summary = useRef<HTMLDivElement>(null);
  const restore = useRef(false);
  useLayoutEffect(() => {
    if (!show && restore.current) {
      restore.current = false;
      const remaining = input.current;
      if (remaining?.ownerDocument.activeElement === remaining?.ownerDocument.body) {
        remaining?.focus();
      }
    }
  }, [show]);

  return (
    <>
      <form
        data-testid="alert-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmissions((total) => total + 1);
        }}
      >
        <label>
          Schema <input ref={input} name="schema" defaultValue="default.yaml" />
        </label>
        <label>
          Date field <input type="date" defaultValue="2026-11-22" />
        </label>
        <label>
          Time field <input type="time" defaultValue="12:00" />
        </label>
        <label>
          Browser-normalized text field <input type="typo" defaultValue="edited" />
        </label>
        <a href="#until-found">Find alert</a>
        <fieldset disabled={disabled}>
          {show && (
            <Alert
              ref={summary}
              status="danger"
              role={urgent ? 'alert' : 'status'}
              id="feedback"
              hidden={hidden}
              close={
                <AlertClose
                  aria-label="Dismiss validation"
                  onClose={() => {
                    setRequests((total) => total + 1);
                    if (accept) {
                      restore.current = Boolean(
                        summary.current?.contains(summary.current.ownerDocument.activeElement),
                      );
                      setShow(false);
                    }
                  }}
                />
              }
            >
              <AlertTitle as="h2">Check the schema</AlertTitle>
              <p>{message}</p>
              <AlertDescription>
                Run <Code>check-schema</Code> or read <Link href="#guide">the guide</Link>.
                <span style={{ display: 'none' }}>Hidden details.</span>
              </AlertDescription>
              <AlertActions>
                <button type="button">Retry</button>
              </AlertActions>
              <Alert role="none">Nested feedback.</Alert>
            </Alert>
          )}
        </fieldset>
        <button type="submit">Submit form</button>
        <button type="reset">Reset form</button>
      </form>
      <div>
        <button type="button" onClick={() => setShow(true)}>
          Show validation
        </button>
        <button type="button" onClick={() => setMessage('Draft B')}>
          Use second message
        </button>
        <button type="button" onClick={() => setUrgent(false)}>
          Use polite role
        </button>
        <button type="button" onClick={() => setHidden((value) => !value)}>
          Toggle visibility
        </button>
        <label>
          <input
            type="checkbox"
            checked={accept}
            onChange={(event) => setAccept(event.target.checked)}
          />{' '}
          Accept dismissal
        </label>
        <label>
          <input
            type="checkbox"
            checked={disabled}
            onChange={(event) => setDisabled(event.target.checked)}
          />{' '}
          Disable fieldset
        </label>
        <span data-testid="close-requests">{requests}</span>
        <span data-testid="submit-requests">{submissions}</span>
      </div>
      <Alert id="until-found" role="none" status="warning">
        <AlertTitle as="h2">Find the static notice</AlertTitle>
        <AlertDescription>
          <a href="#guide">Recovery guide</a>
        </AlertDescription>
      </Alert>
    </>
  );
}

export default function AlertFixture(): JSX.Element {
  return (
    <StrictMode>
      <FeedbackForm />
    </StrictMode>
  );
}
