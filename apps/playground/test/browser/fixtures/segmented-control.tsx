import { SegmentedControl } from '@docouno/unica';
import type { SegmentedControlOption } from '@docouno/unica';
import { useRef, useState } from 'react';
import type { FormEvent, JSX, MouseEvent } from 'react';
import { createPortal, flushSync } from 'react-dom';

const items = [
  { value: 'a', label: 'Alpha' },
  { value: 'b', label: 'Beta' },
  { value: '', label: 'Empty key' },
] as const satisfies readonly SegmentedControlOption[];
const unavailable = [{ ...items[0], disabled: true }, items[1], items[2]];

export function SegmentedFormFixture(): JSX.Element {
  const localForm = useRef<HTMLFormElement>(null);
  const controlledForm = useRef<HTMLFormElement>(null);
  const log = useRef<HTMLOutputElement>(null);
  const [localItems, setLocalItems] = useState<readonly SegmentedControlOption[]>(items);
  const [value, setValue] = useState<string | null>('a');
  const [accept, setAccept] = useState(false);
  const [stopInput, setStopInput] = useState(false);
  const [submitOnChange, setSubmitOnChange] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [cancelKeys, setCancelKeys] = useState(false);
  const [vetoClick, setVetoClick] = useState<
    'root' | 'form' | 'capture' | 'formCapture' | 'stop' | null
  >(null);
  const [form, setForm] = useState('local-answer');
  const [unnamed, setUnnamed] = useState(true);
  const [unnamedDisabled, setUnnamedDisabled] = useState(false);
  const [noAnswerItems, setNoAnswerItems] =
    useState<readonly SegmentedControlOption[]>(unavailable);
  const [detachedHost, setDetachedHost] = useState<HTMLDivElement | null>(null);
  const [detachedValue, setDetachedValue] = useState('a');
  const [detachedUncontrolled, setDetachedUncontrolled] = useState(false);

  function record(owner: HTMLFormElement | null, next: string, phase: string): void {
    if (log.current && owner) {
      const checked = Array.from(
        owner.querySelectorAll<HTMLInputElement>('input:checked'),
        (input) => input.value,
      );
      log.current.textContent +=
        JSON.stringify({ phase, next, data: [...new FormData(owner)], checked }) + '\n';
    }
  }

  function vetoBeta(event: MouseEvent): void {
    if (event.target instanceof HTMLInputElement && event.target.value === 'b') {
      event.preventDefault();
      if (vetoClick === 'capture' || vetoClick === 'formCapture') {
        event.stopPropagation();
      }
      flushSync(() => setValue(''));
    }
  }

  function mountDetached(inShadow: boolean): void {
    const fragment = document.createDocumentFragment();
    const host = document.createElement('div');
    fragment.append(host);
    flushSync(() => setDetachedHost(host));
    if (inShadow) {
      const container = document.createElement('div');
      container.attachShadow({ mode: 'open' }).append(fragment);
      document.body.append(container);
    } else {
      document.body.append(fragment);
    }
  }

  function autoSubmit(event: FormEvent<HTMLFormElement>): void {
    event.currentTarget.requestSubmit();
  }

  function recordSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    record(event.currentTarget, '', 'auto-submit');
  }

  return (
    <>
      <form
        data-testid="local"
        id="local-answer"
        ref={localForm}
        onChange={submitOnChange ? autoSubmit : undefined}
        onSubmit={submitOnChange ? recordSubmit : undefined}
      >
        <SegmentedControl
          aria-label="Local"
          items={localItems}
          name="answer"
          status="danger"
          defaultValue="a"
          required
          onClick={(event) => {
            if (vetoClick === 'root') {
              event.preventDefault();
            }
          }}
          onValueChange={(next) => record(localForm.current, next, 'local')}
        />
        <button type="submit">Submit local</button>
        <button type="reset">Reset local</button>
      </form>
      <form
        data-testid="controlled"
        id="controlled-answer"
        ref={controlledForm}
        onClick={vetoClick === 'form' ? vetoBeta : undefined}
        onClickCapture={vetoClick === 'formCapture' ? vetoBeta : undefined}
        onInputCapture={stopInput ? (event) => event.stopPropagation() : undefined}
        onChange={submitOnChange ? autoSubmit : undefined}
        onSubmit={submitOnChange ? recordSubmit : undefined}
      >
        <button type="button">Before choice</button>
        <SegmentedControl
          aria-label="Controlled"
          items={unavailable}
          name="controlled"
          value={value}
          onKeyDown={(event) => {
            if (cancelKeys) {
              event.preventDefault();
            }
          }}
          onClick={vetoClick === 'root' ? vetoBeta : undefined}
          onClickCapture={(event) => {
            if (vetoClick === 'capture') {
              vetoBeta(event);
            }
            if (vetoClick === 'stop') {
              event.stopPropagation();
            }
          }}
          onValueChange={(next) => {
            record(controlledForm.current, next, 'proposed');
            if (accept) {
              flushSync(() => setValue(next));
              record(controlledForm.current, next, 'accepted');
            }
          }}
          readOnly={readOnly}
        />
        <button type="button">After choice</button>
      </form>
      <SegmentedControl
        aria-label="External"
        items={items}
        form={form}
        name="external"
        defaultValue={null}
      />
      <form data-testid="empty" id="empty-answer">
        <button type="button">Before required</button>
        <SegmentedControl
          aria-label="Required"
          items={noAnswerItems}
          name="required"
          defaultValue={null}
          required
        />
        <button type="button">After required</button>
      </form>
      <form data-testid="unnamed" id="unnamed-answer">
        <button type="button">Before unnamed</button>
        {unnamed && (
          <SegmentedControl aria-label="Unnamed" items={unavailable} defaultValue={null} required />
        )}
        <SegmentedControl aria-label="Other unnamed" items={items} name="" />
        <button type="button">After unnamed</button>
      </form>
      <form data-testid="fieldset" id="fieldset-answer">
        <fieldset disabled={unnamedDisabled}>
          <legend>
            <SegmentedControl aria-label="Legend" items={items} name="legend" />
          </legend>
          <SegmentedControl
            aria-label="Fieldset child"
            items={items}
            name="child"
            status="danger"
          />
          <SegmentedControl
            aria-label="Unnamed fieldset child"
            items={items}
            required
            defaultValue={null}
          />
        </fieldset>
      </form>
      <button type="button" onClick={() => setLocalItems(items.slice(1))}>
        Remove Alpha
      </button>
      <button type="button" onClick={() => setLocalItems([items[0], items[2]])}>
        Remove Beta
      </button>
      <button type="button" onClick={() => setLocalItems(unavailable)}>
        Disable Alpha
      </button>
      <button type="button" onClick={() => setLocalItems(items)}>
        Restore options
      </button>
      <button type="button" onClick={() => setAccept(true)}>
        Accept proposals
      </button>
      <button type="button" onClick={() => setValue('missing')}>
        Commit unknown
      </button>
      <button type="button" onClick={() => setValue('a')}>
        Commit Alpha
      </button>
      <button type="button" onClick={() => setReadOnly((previous) => !previous)}>
        Toggle read only
      </button>
      <button type="button" onClick={() => setCancelKeys(true)}>
        Cancel keys
      </button>
      <button type="button" onClick={() => setVetoClick('root')}>
        Veto click and commit another option
      </button>
      <button type="button" onClick={() => setVetoClick('form')}>
        Veto click in form and commit another option
      </button>
      <button type="button" onClick={() => setVetoClick('capture')}>
        Veto click in capture and commit another option
      </button>
      <button type="button" onClick={() => setVetoClick('formCapture')}>
        Veto click in form capture and commit another option
      </button>
      <button type="button" onClick={() => setVetoClick('stop')}>
        Stop click propagation
      </button>
      <button type="button" onClick={() => setStopInput(true)}>
        Stop input propagation
      </button>
      <button type="button" onClick={() => setSubmitOnChange(true)}>
        Submit from delegated change
      </button>
      <button
        type="button"
        onClick={() => {
          localForm.current?.reset();
          flushSync(() => setLocalItems((current) => [...current]));
          localForm.current?.requestSubmit();
        }}
      >
        Reset and refresh local choices
      </button>
      <button
        type="button"
        onClick={() => {
          localForm.current?.reset();
          flushSync(() => setForm('controlled-answer'));
        }}
      >
        Reset and move external owner
      </button>
      <button type="button" onClick={() => setDetachedUncontrolled(true)}>
        Use uncontrolled adopted group
      </button>
      <button type="button" onClick={() => mountDetached(false)}>
        Mount detached group
      </button>
      <button type="button" onClick={() => mountDetached(true)}>
        Mount detached group in shadow
      </button>
      {detachedHost &&
        createPortal(
          <form
            data-testid="detached-form"
            onClickCapture={(event) => {
              if (event.target instanceof HTMLInputElement && event.target.value === 'a') {
                event.preventDefault();
                event.stopPropagation();
                flushSync(() => setDetachedValue('b'));
              }
            }}
          >
            <SegmentedControl
              aria-label="Adopted group"
              items={localItems}
              name="adopted"
              value={detachedUncontrolled ? undefined : detachedValue}
              defaultValue="a"
            />
            <button type="button" onClick={() => setLocalItems((current) => [...current])}>
              Refresh adopted choices
            </button>
          </form>,
          detachedHost,
        )}
      <button type="button" onClick={() => setForm('controlled-answer')}>
        Move external owner
      </button>
      <button type="button" onClick={() => setUnnamed(false)}>
        Unmount unnamed
      </button>
      <button type="button" onClick={() => setUnnamedDisabled((previous) => !previous)}>
        Toggle fieldset
      </button>
      <button type="button" onClick={() => setNoAnswerItems([])}>
        Clear required options
      </button>
      <button type="button" onClick={() => setNoAnswerItems([unavailable[0]!])}>
        Disable all required options
      </button>
      <output data-testid="log" ref={log} />
    </>
  );
}

export default SegmentedFormFixture;
