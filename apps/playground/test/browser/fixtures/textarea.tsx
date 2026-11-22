import { Textarea } from '@docouno/unica';
import { useState } from 'react';
import type { JSX } from 'react';

const wrapText =
  'Read the complete reference for the next project update.\r\nMore context follows here.';
const overflow = Array.from(
  { length: 12 },
  (_, index) => `Line ${index + 1}: ${'a'.repeat(80)} END`,
);

function ControlledField(): JSX.Element {
  const [value, setValue] = useState('hello\r\nthere');
  const [accept, setAccept] = useState(true);
  const [invalid, setInvalid] = useState(false);
  const [proposals, setProposals] = useState<string[]>([]);
  const [composition, setComposition] = useState<string[]>([]);
  return (
    <form id="controlled">
      <label htmlFor="managed">Managed draft</label>
      <Textarea
        id="managed"
        name="managed"
        value={value}
        status={invalid ? 'danger' : 'neutral'}
        onCompositionStart={() => setComposition((previous) => [...previous, 'start'])}
        onCompositionEnd={() => setComposition((previous) => [...previous, 'end'])}
        onChange={(event) => {
          const draft = event.currentTarget.value;
          setProposals((previous) => [...previous, draft]);
          if (accept) {
            setValue(draft.replaceAll('\n', '\r\n'));
          }
        }}
      />
      <output data-testid="proposals">{JSON.stringify(proposals)}</output>
      <output data-testid="composition">{JSON.stringify(composition)}</output>
      <button type="button" onClick={() => setAccept(!accept)}>
        Toggle acceptance
      </button>
      <button type="button" onClick={() => setInvalid(!invalid)}>
        Toggle danger
      </button>
      <button type="button" onClick={() => setValue('A different draft')}>
        Replace draft
      </button>
      <button type="reset">Reset managed draft</button>
    </form>
  );
}

function ExternalField(): JSX.Element {
  const [owner, setOwner] = useState('home');
  const [initial, setInitial] = useState('A');
  const [changes, setChanges] = useState<unknown[]>([]);
  return (
    <section>
      <form id="home">
        <button type="reset">Reset home</button>
      </form>
      <form id="away">
        <button type="reset">Reset away</button>
      </form>
      <button type="button" onClick={() => setOwner(owner === 'home' ? 'away' : 'home')}>
        Move form owner
      </button>
      <button type="button" onClick={() => setInitial('B')}>
        Change default
      </button>
      <label htmlFor="external">External draft</label>
      <Textarea
        id="external"
        name="external"
        form={owner}
        defaultValue={initial}
        autosize
        maxRows={5}
        onChange={(event) => {
          const editor = event.currentTarget;
          const entry = [editor.value, new FormData(editor.form!).get(editor.name)];
          setChanges((previous) => [...previous, entry]);
        }}
      />
      <output data-testid="external-changes">{JSON.stringify(changes)}</output>
    </section>
  );
}

function Availability(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [disabledGroup, setDisabledGroup] = useState(false);
  const [events, setEvents] = useState<string[]>([]);
  return (
    <section>
      <form id="availability" />
      <button type="button" onClick={() => setDisabled(!disabled)}>
        Toggle disabled
      </button>
      <button type="button" onClick={() => setReadOnly(!readOnly)}>
        Toggle read-only
      </button>
      <button type="button" onClick={() => setDisabledGroup(!disabledGroup)}>
        Toggle fieldset
      </button>
      <fieldset disabled={disabledGroup}>
        <legend>
          <Textarea
            aria-label="Legend field"
            name="legend"
            form="availability"
            defaultValue="Legend"
            status="danger"
          />
        </legend>
        <label htmlFor="availability-notes">Required notes</label>
        <Textarea
          id="availability-notes"
          aria-describedby="availability-feedback"
          status="danger"
          variant="ghost"
          name="notes"
          form="availability"
          required
          disabled={disabled}
          readOnly={readOnly}
          onCompositionStart={() => setEvents((events) => [...events, 'start'])}
          onCompositionEnd={() => setEvents((events) => [...events, 'end'])}
          onChange={(event) => {
            const draft = event.currentTarget.value;
            setEvents((events) => [...events, draft]);
          }}
        />
        <p id="availability-feedback">Add useful context.</p>
      </fieldset>
      <button type="button">After notes</button>
      <output data-testid="editor-events">{JSON.stringify(events)}</output>
    </section>
  );
}

function HeightModes(): JSX.Element {
  const [mode, setMode] = useState<'manual' | 'fixed' | 'auto'>('manual');
  const [rows, setRows] = useState(3);
  const [danger, setDanger] = useState(false);
  const [authorHeight, setAuthorHeight] = useState(false);
  return (
    <section style={{ inlineSize: 'min(100%, 410px)' }}>
      <button type="button" onClick={() => setMode('fixed')}>
        Fixed height
      </button>
      <button type="button" onClick={() => setMode('auto')}>
        Autosize height
      </button>
      <button type="button" onClick={() => setRows(5)}>
        Five rows
      </button>
      <button type="button" onClick={() => setDanger(!danger)}>
        Change status
      </button>
      <button type="button" onClick={() => setAuthorHeight(!authorHeight)}>
        Author height
      </button>
      <Textarea
        aria-label="Height test"
        name="height"
        defaultValue="Short draft"
        resize={mode === 'fixed' ? 'none' : 'vertical'}
        rows={rows}
        autosize={mode === 'auto'}
        maxRows={5}
        status={danger ? 'danger' : 'neutral'}
        style={{ height: authorHeight ? 108 : undefined, fontWeight: 500 }}
      />
      <Textarea aria-label="Unbounded draft" autosize defaultValue={overflow.join('\n')} />
      <Textarea
        aria-label="Unwrapped log"
        autosize
        maxRows={5}
        wrap="OFF"
        dir="ltr"
        status="info"
        defaultValue={overflow.join('\n')}
      />
    </section>
  );
}

function Materials(): JSX.Element {
  return (
    <section data-testid="materials" style={{ background: 'var(--bg-surface)', padding: 12 }}>
      <Textarea aria-label="Small field" size="s" status="danger" defaultValue="Release note" />
      <Textarea aria-label="Medium field" size="m" status="info" defaultValue="Release note" />
      <Textarea aria-label="Large field" size="l" status="warning" defaultValue="Release note" />
      <Textarea aria-label="Inline field" variant="ghost" placeholder="Add a note" />
    </section>
  );
}

function NativeWrapping(): JSX.Element {
  return (
    <form id="wrapping" style={{ inlineSize: 240 }}>
      {(['soft', 'hard'] as const).map((wrap) => (
        <div key={wrap}>
          <Textarea
            aria-label={`Package ${wrap}`}
            name={`package-${wrap}`}
            wrap={wrap}
            cols={18}
            rows={8}
            defaultValue={wrapText}
          />
          <textarea
            aria-label={`Native ${wrap}`}
            name={`native-${wrap}`}
            wrap={wrap}
            cols={18}
            rows={8}
            defaultValue={wrapText}
          />
        </div>
      ))}
    </form>
  );
}

export default function TextareaFixture(): JSX.Element {
  return (
    <>
      <ControlledField />
      <ExternalField />
      <Availability />
      <HeightModes />
      <Materials />
      <NativeWrapping />
    </>
  );
}
