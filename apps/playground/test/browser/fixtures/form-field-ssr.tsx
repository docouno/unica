import { FormField, Input, Textarea } from '@docouno/unica';
import { useEffect, useRef, useState } from 'react';

export default function ServerFields() {
  const form = useRef<HTMLFormElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [events, setEvents] = useState(0);
  const [accept, setAccept] = useState(false);
  const [concealed, setConcealed] = useState(true);
  const [hiddenByClass, setHiddenByClass] = useState(true);
  const [owned, setOwned] = useState('Owner text');
  useEffect(() => {
    form.current?.setAttribute('data-hydrated', '');
    form.current?.toggleAttribute('data-ref-matches', input.current?.form === form.current);
  }, []);
  return (
    <form ref={form} data-testid="server-form">
      <style>{'.fixture-hide-editor .fixture-glyph-editor { visibility: hidden; }'}</style>
      <p id="server-hint">Author hint.</p>
      <FormField
        label="Project"
        required
        description="Used in the title."
        status="danger"
        message="Check the name."
        counter={0}
      >
        <Input
          ref={input}
          name="project"
          defaultValue="Initial title"
          aria-describedby="server-hint server-hint"
          onChange={() => setEvents((count) => count + 1)}
        />
      </FormField>
      <FormField
        label="Project"
        controlId="owner-note"
        labelAction={
          <button type="button" onClick={() => setAccept(true)}>
            Accept edits
          </button>
        }
      >
        <Textarea
          name="note"
          value={owned}
          onChange={(event) => {
            setEvents((count) => count + 1);
            if (accept) {
              setOwned(event.currentTarget.value);
            }
          }}
        />
      </FormField>
      <FormField
        data-testid="outer-glyph"
        label="Outer editor"
        status="warning"
        message="Outer advisory."
      >
        <div>
          <Input />
          <FormField
            data-testid="nested-glyph"
            label="Nested editor"
            status="danger"
            message="Nested error."
          >
            <Input />
          </FormField>
        </div>
      </FormField>
      <FormField
        data-testid="hidden-glyph"
        label="Concealed editor"
        status="warning"
        message="Retained advisory."
      >
        <div hidden={concealed}>
          <Input />
        </div>
      </FormField>
      <button type="button" onClick={() => setConcealed(false)}>
        Reveal editor
      </button>
      <FormField
        data-testid="style-hidden-glyph"
        className={hiddenByClass ? 'fixture-hide-editor' : undefined}
        label="Styled editor"
        status="warning"
        message="Styled advisory."
      >
        <Input className="fixture-glyph-editor" />
      </FormField>
      <button type="button" onClick={() => setHiddenByClass(!hiddenByClass)}>
        Toggle editor visibility
      </button>
      <output data-testid="edit-count">{events}</output>
      <button type="reset">Reset fields</button>
    </form>
  );
}
