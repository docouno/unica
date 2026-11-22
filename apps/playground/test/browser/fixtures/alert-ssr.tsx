import { Alert, AlertActions, AlertDescription, AlertTitle, defineGlyph } from '@docouno/unica';
import { StrictMode, useState } from 'react';
import type { JSX } from 'react';

const emptyGlyph = defineGlyph(() => null);

function Messages(): JSX.Element {
  const [heading, setHeading] = useState(true);
  const [label, setLabel] = useState('Recovery guide');
  const [message, setMessage] = useState('Check import.yml.');
  return (
    <>
      {heading && <h2 id="reference">{label}</h2>}
      <Alert
        role="region"
        aria-labelledby="reference"
        aria-label="Fallback label"
        data-testid="named"
      >
        <AlertDescription>Read the release notes.</AlertDescription>
        <AlertActions>
          <button type="button">Keep focus here</button>
        </AlertActions>
      </Alert>
      {!heading && <h2 id="late">New heading</h2>}
      <Alert role="region" aria-labelledby="late" data-testid="late-region">
        Waiting on a heading.
      </Alert>
      <Alert status="danger" icon={emptyGlyph} data-testid="hydrated-alert">
        <AlertTitle>Import failed</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
      </Alert>
      <Alert status="neutral" role="none" icon={emptyGlyph} data-testid="hydrated-neutral">
        Neutral note.
      </Alert>
      <button onClick={() => setHeading(!heading)}>Toggle heading</button>
      <button onClick={() => setLabel(label ? '' : 'Recovery guide')}>Toggle label text</button>
      <button onClick={() => setMessage('Check schema.yml.')}>Update message</button>
    </>
  );
}

export default function AlertSsrFixture(): JSX.Element {
  return (
    <StrictMode>
      <Messages />
    </StrictMode>
  );
}
