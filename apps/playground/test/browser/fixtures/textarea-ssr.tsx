import { Textarea } from '@docouno/unica';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';

export default function TextareaSsr(): JSX.Element {
  const [danger, setDanger] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  const form = useRef<HTMLFormElement>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const rememberManagedValue = useCallback((node: HTMLTextAreaElement | null): void => {
    const owner = node?.form;
    if (node && owner) {
      owner.dataset.refValue = JSON.stringify([node.value, new FormData(owner).get(node.name)]);
    }
  }, []);

  useEffect(() => {
    if (form.current) {
      form.current.dataset.hydrated = '';
      form.current.toggleAttribute(
        'data-ref-matches',
        editor.current === form.current.elements.namedItem('draft'),
      );
    }
  }, []);

  return (
    <>
      <form id="ssr-notes" ref={form} data-edits={JSON.stringify(events)}>
        <label htmlFor="ssr-draft">Server draft</label>
        <Textarea
          id="ssr-draft"
          ref={editor}
          name="draft"
          defaultValue="A"
          status={danger ? 'danger' : 'neutral'}
          onChange={(event) => {
            const draft = event.currentTarget.value;
            setEvents((events) => [...events, draft]);
          }}
        />
        <label htmlFor="plain-ssr">Plain draft</label>
        <textarea id="plain-ssr" name="plain" defaultValue="A" />
        <button type="button" onClick={() => setDanger(!danger)}>
          Change server draft status
        </button>
        <button type="reset">Reset server draft</button>
      </form>
      <form id="ssr-managed-form">
        <Textarea
          aria-label="Server managed draft"
          name="managed"
          value="Owner value"
          ref={rememberManagedValue}
        />
      </form>
    </>
  );
}
