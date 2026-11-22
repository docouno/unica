import { Button } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

export default function ServerButtonActions(): JSX.Element {
  const [pending, setPending] = useState(true);
  const fixture = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = fixture.current;
    if (section) {
      section.dataset.hydrated = '';
    }
  }, []);

  return (
    <section ref={fixture} data-testid="server-button-actions">
      <button type="button">Before server form</button>
      <form data-testid="server-form">
        <input name="query" aria-label="Server query" defaultValue="Server initial" />
        <Button type="submit" name="outcome" value="first" loading={pending}>
          Server first submit
        </Button>
        <Button type="submit" name="outcome" value="second">
          Server second submit
        </Button>
        <Button type="reset" loading={pending}>
          Server reset
        </Button>
      </form>
      <Button loading={pending} popoverTarget="server-button-popover">
        Server popover invoker
      </Button>
      <div id="server-button-popover" popover="auto">
        Server popover
      </div>
      <Button loading={pending} commandFor="server-button-dialog" command="show-modal">
        Server dialog invoker
      </Button>
      <dialog id="server-button-dialog">Server dialog</dialog>
      <fieldset disabled>
        <legend>
          Group{' '}
          <Button type="submit" loading={pending}>
            Server legend action
          </Button>
        </legend>
        <Button type="submit" loading={pending}>
          Server fieldset action
        </Button>
      </fieldset>
      <Button type="submit" disabled loading={pending}>
        Server disabled action
      </Button>
      <Button asChild loading={pending}>
        <a href="#server-route">Server pending link</a>
      </Button>
      <Button asChild disabled>
        <a href="#server-missing">Server disabled link</a>
      </Button>
      <button type="button" onClick={() => setPending(false)}>
        Complete server actions
      </button>
    </section>
  );
}
