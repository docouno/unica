import { Input } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';

export default function ServerInputs() {
  const form = useRef<HTMLFormElement>(null);
  const [events, setEvents] = useState(0);
  const [owned, setOwned] = useState('owned');
  useEffect(() => {
    form.current?.setAttribute('data-input-hydrated', '');
  }, []);
  return (
    <form ref={form} data-testid="ssr-form">
      <label htmlFor="ssr-local">Server default</label>
      <Input
        id="ssr-local"
        name="local"
        defaultValue="initial"
        clearable
        onChange={() => setEvents(events + 1)}
      />
      <label htmlFor="ssr-owner">Server owner</label>
      <Input
        id="ssr-owner"
        name="owner"
        value={owned}
        clearable
        onChange={(event) => {
          setOwned(event.currentTarget.value);
          setEvents(events + 1);
        }}
      />
      <button type="reset">Reset SSR input</button>
      <output data-testid="ssr-events">{events}</output>
    </form>
  );
}
