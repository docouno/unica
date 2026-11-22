import { Input } from '@docouno/unica';
import { EnvelopeSimpleIcon } from '@phosphor-icons/react';
import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function ValueAuthority() {
  const [mode, setMode] = useState('reject');
  const [value, setValue] = useState('hello');
  const [initial, setInitial] = useState('abc');
  const [observations, setObservations] = useState<readonly unknown[]>([]);
  const append = (value: unknown): void => setObservations((previous) => [...previous, value]);
  return (
    <>
      <label htmlFor="input-owner-mode">Owner behavior</label>
      <select
        id="input-owner-mode"
        value={mode}
        onChange={(event) => setMode(event.currentTarget.value)}
      >
        <option value="reject">Reject</option>
        <option value="accept">Accept</option>
        <option value="transform">Transform</option>
        <option value="ime">Commit composition</option>
      </select>
      <button type="button" onClick={() => setValue('hello')}>
        Restore owner
      </button>
      <button type="button" onClick={() => setInitial('different')}>
        Change mount default prop
      </button>
      <form data-testid="values-form">
        <Input
          id="owned"
          aria-label="Controlled field"
          name="controlled"
          value={value}
          clearable
          onChange={(event) => {
            const target = event.currentTarget;
            append(['controlled', target.value, new FormData(target.form!).get('controlled')]);
            if (mode === 'accept') {
              setValue(target.value);
            }
            if (mode === 'transform') {
              setValue(target.value.toUpperCase());
            }
          }}
          onCompositionStart={() => append('composition start')}
          onCompositionEnd={(event) => {
            append('composition end');
            if (mode === 'ime') {
              setValue(event.currentTarget.value);
            }
          }}
          onClear={() => append('controlled clear')}
        />
        <Input
          id="local"
          aria-label="Uncontrolled field"
          name="uncontrolled"
          defaultValue={initial}
          clearable
          onChange={(event) => {
            const target = event.currentTarget;
            append(['uncontrolled', target.value, new FormData(target.form!).get('uncontrolled')]);
          }}
          onClear={() => append('uncontrolled clear')}
        />
        <button type="reset">Reset values</button>
      </form>
      <output data-testid="observations">{JSON.stringify(observations)}</output>
    </>
  );
}

function NativeForms() {
  const [owner, setOwner] = useState('outside');
  const [type, setType] = useState<'text' | 'email'>('email');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState(0);
  const [frame, setFrame] = useState<HTMLElement | null>(null);
  const frameRef = useRef<HTMLIFrameElement>(null);
  return (
    <>
      <button type="button" onClick={() => setOwner('other')}>
        Change form owner
      </button>
      <button type="button" onClick={() => setType('text')}>
        Change input type
      </button>
      <button type="button" onClick={() => setBusy(!busy)}>
        Toggle loading
      </button>
      <form id="outside" data-testid="outside">
        <button type="submit">Submit outside</button>
      </form>
      <form id="other" data-testid="other">
        <button type="submit">Submit other</button>
      </form>
      <form data-testid="named-dom-property">
        <Input
          id="same-name"
          name="parentNode"
          defaultValue="initial"
          aria-label="Named native field"
        />
      </form>
      <fieldset data-testid="fieldset">
        <legend data-testid="first-legend">
          <Input
            aria-label="First legend field"
            name="legend"
            form={owner}
            defaultValue="first"
            clearable
          />
        </legend>
        <legend data-testid="second-legend">
          <Input
            aria-label="Second legend field"
            name="legend"
            form={owner}
            defaultValue="second"
          />
        </legend>
        <div data-testid="fieldset-body">
          <Input
            id="inside"
            aria-label="Fieldset field"
            name="inside"
            form={owner}
            defaultValue="inside"
            iconRight={EnvelopeSimpleIcon}
            clearable
            loading
            status="danger"
          />
        </div>
      </fieldset>
      <Input
        id="required"
        aria-label="Required outside field"
        name="required"
        form={owner}
        required
      />
      <Input aria-label="Unnamed field" form={owner} defaultValue="unused" />
      <Input aria-label="Named empty" name="empty" form={owner} />
      <Input aria-label="Second repeated" name="legend" form={owner} defaultValue="outside" />
      <div data-testid="inert-parent">
        <Input
          id="inert"
          aria-label="Inert candidate"
          name="inert"
          form={owner}
          defaultValue="retained"
          clearable
        />
      </div>
      <Input
        id="inert-self"
        aria-label="Explicit inert"
        name="self"
        form={owner}
        defaultValue="retained"
        inert
        clearable
      />
      <Input
        id="email"
        aria-label="Normalized email"
        type={type}
        name="email"
        form={owner}
        defaultValue="   "
        clearable
      />
      <Input
        id="url"
        aria-label="Normalized URL"
        type="url"
        name="url"
        form={owner}
        value=" https://example.com/ "
        clearable
      />
      <Input aria-label="One line" name="line" form={owner} defaultValue={'new\r\nline'} />
      <Input
        id="readonly"
        aria-label="Read-only busy"
        name="readOnly"
        form={owner}
        defaultValue="locked"
        readOnly
        status="danger"
        loading
        clearable
      />
      <Input
        id="busy-transition"
        aria-label="Busy transition"
        name="transition"
        form={owner}
        defaultValue="working"
        loading={busy}
        clearable
      />
      <iframe
        title="Input realm"
        ref={frameRef}
        srcDoc="<body></body>"
        onLoad={() => setFrame(frameRef.current?.contentDocument?.body ?? null)}
      />
      {frame &&
        createPortal(
          <Input
            id="frame-input"
            aria-label="Frame input"
            defaultValue="original"
            clearable
            onChange={() => setEvents((count) => count + 1)}
            onClear={() => setEvents((count) => count + 10)}
          />,
          frame,
        )}
      <output data-testid="realm-events">{events}</output>
    </>
  );
}

function Geometry() {
  return (
    <div data-testid="geometry" style={{ inlineSize: 'min(100%, 340px)' }}>
      <button type="button">Before inputs</button>
      {(['s', 'm', 'l'] as const).map((size) => (
        <div key={size} data-testid={`size-${size}`}>
          <Input
            id={`size-${size}`}
            aria-label={`Field ${size}`}
            size={size}
            type="search"
            variant="ghost"
            iconLeft={EnvelopeSimpleIcon}
            prefix="@"
            suffix=".example"
            defaultValue="Folio"
            clearable
            status="warning"
          />
        </div>
      ))}
      <div data-testid="empty-ghost">
        <Input aria-label="Empty ghost" variant="ghost" placeholder="Enter a reference" />
      </div>
      <div data-testid="load-and-status">
        <Input aria-label="Busy warning" status="warning" loading clearable defaultValue="Text" />
      </div>
      <div data-testid="native-search">
        <Input aria-label="No Clear search" type="search" defaultValue="Text" />
      </div>
      <div data-testid="busy-search">
        <Input aria-label="Busy search" type="search" loading clearable defaultValue="Text" />
      </div>
    </div>
  );
}

export default function InputFixture() {
  const [showClearGuard, setShowClearGuard] = useState(true);
  const [clearEvents, setClearEvents] = useState<readonly string[]>([]);
  const record = (event: string): void => setClearEvents((events) => [...events, event]);
  return (
    <>
      <Geometry />
      <ValueAuthority />
      <NativeForms />
      {showClearGuard && (
        <Input
          id="clear-guard"
          aria-label="Removed on clear"
          defaultValue="Disposable"
          clearable
          onFocus={() => record('focus')}
          onChange={() => record('change')}
          onClear={() => {
            record('clear');
            setShowClearGuard(false);
          }}
        />
      )}
      <output data-testid="clear-events">{JSON.stringify(clearEvents)}</output>
    </>
  );
}
