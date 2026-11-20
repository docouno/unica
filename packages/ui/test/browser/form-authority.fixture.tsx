import { StrictMode, useEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import type { Root } from 'react-dom/client';
import {
  FormInput,
  FormSelect,
  FormTextarea,
  writeInputChecked,
  writeInputValue,
  writeRadioGroup,
  writeTextareaValue,
} from '../../src/core/forms/carriers.js';
import { useFormValue } from '../../src/core/forms/useFormValue.js';
import { useFixtureSelect } from './form-fixture-helpers.js';

function AuthorityFixture(): JSX.Element {
  const log = useRef<HTMLOutputElement>(null);
  const messages = useRef<unknown[]>([]);
  const trigger = useRef<HTMLButtonElement>(null);
  const controlledTrigger = useRef<HTMLButtonElement>(null);
  const multiTrigger = useRef<HTMLButtonElement>(null);
  const check = useRef<HTMLInputElement>(null);
  const [localDefault, setLocalDefault] = useState('a');
  const [controlled, setControlled] = useState('a');
  const [owner, setOwner] = useState('first');
  const [firstKey, setFirstKey] = useState(0);
  const [associated, setAssociated] = useState(true);
  const [controlledAccept, setControlledAccept] = useState(false);
  const [radioLocal, setRadioLocal] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [visible, setVisible] = useState(true);
  const catalog = [{ value: 'a' }, { value: 'b' }, { value: 'c' }, { value: 'd' }];

  function record(
    phase: string,
    value: string | null,
    control: HTMLInputElement | HTMLSelectElement | null,
    checked?: boolean[],
  ): void {
    if (!log.current) {
      return;
    }
    const entries = control?.form ? [...new FormData(control.form)] : [];
    messages.current.push({ phase, value, entries, checked });
    log.current.textContent = JSON.stringify(messages.current);
  }

  const localCarrier = useRef<HTMLSelectElement>(null);
  const local = useFixtureSelect<string | null>(localCarrier, {
    defaultValue: localDefault,
    catalog,
    onChange: (next) => {
      record('local', next, localCarrier.current);
      if (next === 'b') {
        local.propose('c');
      }
    },
  });
  const stableCarrier = useRef<HTMLSelectElement>(null);
  const stable = useFixtureSelect<string | null>(stableCarrier, {
    value: controlled,
    defaultValue: 'a',
    readOnly,
    catalog,
    onChange: (next) => {
      record('controlled', next, stableCarrier.current);
      if (controlledAccept) {
        flushSync(() => setControlled('c'));
        record('committed', 'c', stableCarrier.current);
      }
    },
  });
  const multiCarrier = useRef<HTMLSelectElement>(null);
  const multi = useFixtureSelect<readonly string[]>(multiCarrier, {
    defaultValue: localDefault === 'a' ? ['b', 'a'] : ['d'],
    catalog,
  });
  const checked = useFormValue<boolean>({
    defaultValue: localDefault === 'a',
    getControl: () => check.current,
    write: (next, context) => {
      if (check.current) {
        writeInputChecked(check.current, next, { syncDefault: context.controlled });
      }
    },
  });
  return (
    <>
      <form id="first" key={firstKey}>
        <button type="reset">Reset first</button>
      </form>
      <form id="second">
        <button type="reset">Reset second</button>
      </form>
      <RadioFixture key={String(radioLocal)} local={radioLocal} record={record} />
      <LiveTextFixture />
      <ShadowResetHost />
      {visible && (
        <FormSelect
          ref={localCarrier}
          name="local"
          form={associated ? owner : 'missing'}
          initialValue={local.value}
          options={catalog}
          getFocusTarget={() => trigger.current}
          onChange={(event) => local.propose(event.currentTarget.value)}
        />
      )}
      <button ref={trigger} type="button" onClick={() => local.propose('b')}>
        Change local to B
      </button>
      <output data-testid="local-value">{local.value}</output>
      <FormSelect
        ref={stableCarrier}
        name="controlled"
        form={owner}
        initialValue={stable.value}
        options={catalog}
        getFocusTarget={() => controlledTrigger.current}
        onChange={(event) => stable.propose(event.currentTarget.value)}
      />
      <button ref={controlledTrigger} type="button" onClick={() => stable.propose('b')}>
        Propose controlled B
      </button>
      <button type="button" onClick={() => setControlled('c')}>
        Set controlled C
      </button>
      <button type="button" onClick={() => setControlledAccept(true)}>
        Accept controlled as C
      </button>
      <button type="button" onClick={() => setReadOnly(!readOnly)}>
        Toggle controlled read only
      </button>
      <button type="button" onClick={() => setRadioLocal(true)}>
        Use local radio
      </button>
      <FormSelect
        ref={multiCarrier}
        name="multi"
        form={owner}
        initialValue={multi.value}
        options={catalog}
        getFocusTarget={() => multiTrigger.current}
      />
      <button ref={multiTrigger} type="button" onClick={() => multi.propose(['c'])}>
        Change multi
      </button>
      <label>
        <FormInput
          ref={check}
          type="checkbox"
          name="checked"
          value="yes"
          form={owner}
          defaultChecked={checked.value}
          aria-label="Authority checkbox"
          onChange={(event) => checked.propose(event.currentTarget.checked)}
        />
        <span data-testid="adjacent-indicator">Adjacent</span>
      </label>
      <button type="button" onClick={() => setLocalDefault('d')}>
        Change defaults
      </button>
      <button type="button" onClick={() => setOwner('second')}>
        Associate second
      </button>
      <button type="button" onClick={() => setFirstKey(firstKey + 1)}>
        Replace first form
      </button>
      <button type="button" onClick={() => setAssociated(!associated)}>
        Toggle association
      </button>
      <button type="button" onClick={() => setVisible(!visible)}>
        Toggle local mount
      </button>
      <output data-testid="log" ref={log} />
    </>
  );
}

interface RadioFixtureProps {
  local: boolean;
  record: (
    phase: string,
    value: string | null,
    control: HTMLInputElement | null,
    checked: boolean[],
  ) => void;
}

function RadioFixture({ local, record }: RadioFixtureProps): JSX.Element {
  const radioA = useRef<HTMLInputElement>(null);
  const radioB = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState('a');
  const [accept, setAccept] = useState(false);
  const [disableA, setDisableA] = useState(false);
  const [showA, setShowA] = useState(true);
  const radioChecks = (): boolean[] => [
    radioA.current?.checked ?? false,
    radioB.current?.checked ?? false,
  ];
  const radio = useFormValue<string | null>({
    value: local ? undefined : value,
    defaultValue: 'a',
    getControls: () => [radioA.current, radioB.current],
    write: (next, context) => {
      const radios = [radioA.current, radioB.current].filter(
        (node): node is HTMLInputElement => node !== null,
      );
      if (radios.length > 0 && radios.every((node) => node.form === radios[0]!.form)) {
        writeRadioGroup(radios, next, { syncDefault: context.controlled });
      }
    },
    onChange: (next) => {
      record(
        local ? 'local radio' : 'radio',
        next,
        radioA.current ?? radioB.current,
        radioChecks(),
      );
      if (accept) {
        flushSync(() => setValue('b'));
        record('radio committed', 'b', radioA.current ?? radioB.current, radioChecks());
      }
    },
  });
  return (
    <form id="radios">
      {showA && (
        <label>
          <FormInput
            ref={radioA}
            controlled={!local}
            type="radio"
            name="radio"
            value="a"
            disabled={disableA}
            defaultChecked={local ? true : value === 'a'}
            onChange={(event) => radio.propose('a', event.currentTarget)}
          />
          Radio A
        </label>
      )}
      <label>
        <FormInput
          ref={radioB}
          controlled={!local}
          type="radio"
          name="radio"
          value="b"
          defaultChecked={local ? false : value === 'b'}
          onChange={(event) => radio.propose('b', event.currentTarget)}
        />
        Radio B
      </label>
      <input
        type="radio"
        name="other-radio"
        value="other"
        defaultChecked
        aria-label="Other radio"
      />
      <button type="button" onClick={() => setAccept(true)}>
        Accept radio B
      </button>
      <button type="button" onClick={() => setDisableA(!disableA)}>
        Toggle disable radio A
      </button>
      <button type="button" onClick={() => setShowA(!showA)}>
        Toggle mount radio A
      </button>
    </form>
  );
}

function LiveTextFixture(): JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null);
  const areaRef = useRef<HTMLTextAreaElement>(null);
  const [text, setText] = useState('hello');
  const [acceptText, setAcceptText] = useState(true);
  const [resetCount, setResetCount] = useState(0);

  const controlledText = useFormValue<string>({
    value: text,
    defaultValue: 'hello',
    commitMode: 'deferred',
    getControl: () => inputRef.current,
    write: (next, context) => {
      if (inputRef.current) {
        writeInputValue(inputRef.current, next, { syncDefault: context.controlled });
      }
    },
    onChange: (next) => {
      if (acceptText) {
        setText(next);
      }
    },
    onReset: () => setResetCount((count) => count + 1),
  });

  const localArea = useFormValue<string>({
    defaultValue: 'initial notes',
    commitMode: 'deferred',
    getControl: () => areaRef.current,
    write: (next, context) => {
      if (areaRef.current) {
        writeTextareaValue(areaRef.current, next, { syncDefault: context.controlled });
      }
    },
    onReset: () => setResetCount((count) => count + 1),
  });

  return (
    <form id="live-text">
      <FormInput
        ref={inputRef}
        controlled
        name="live"
        aria-label="Live controlled input"
        defaultValue={controlledText.value}
        onChange={(event) => controlledText.propose(event.currentTarget.value)}
      />
      <FormTextarea
        ref={areaRef}
        name="notes"
        aria-label="Local textarea"
        defaultValue={localArea.value}
        onChange={(event) => localArea.propose(event.currentTarget.value)}
      />
      <button type="button" onClick={() => setAcceptText(!acceptText)}>
        Toggle accept live text
      </button>
      <button type="reset">Reset live text</button>
      <output data-testid="live-text-value">{controlledText.value}</output>
      <output data-testid="local-area-value">{localArea.value}</output>
      <output data-testid="live-reset-count">{resetCount}</output>
    </form>
  );
}

function ShadowFormInner(): JSX.Element {
  const selectRef = useRef<HTMLSelectElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const catalog = [{ value: 'a' }, { value: 'b' }];
  const choice = useFixtureSelect<string | null>(selectRef, {
    defaultValue: 'a',
    catalog,
  });
  return (
    <form id="shadow-form">
      <button ref={triggerRef} type="button" onClick={() => choice.propose('b')}>
        Shadow choose B
      </button>
      <FormSelect
        ref={selectRef}
        name="shadowChoice"
        required
        initialValue={choice.value}
        options={catalog}
        getFocusTarget={() => triggerRef.current}
      />
      <button type="button" onClick={() => choice.propose(null)}>
        Shadow clear
      </button>
      <button type="reset">Shadow reset</button>
      <output data-testid="shadow-value">{choice.value ?? 'empty'}</output>
    </form>
  );
}

function ShadowResetHost(): JSX.Element {
  const hostRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }
    const shadow = host.shadowRoot ?? host.attachShadow({ mode: 'open' });
    const mount = document.createElement('div');
    shadow.replaceChildren(mount);
    const root: Root = createRoot(mount);
    root.render(<ShadowFormInner />);
    return () => {
      root.unmount();
    };
  }, []);
  return <div id="shadow-reset-host" ref={hostRef} />;
}

export default function StrictAuthorityFixture(): JSX.Element {
  return (
    <StrictMode>
      <AuthorityFixture />
    </StrictMode>
  );
}
