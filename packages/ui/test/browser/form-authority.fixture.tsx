import { StrictMode, useRef, useState } from 'react';
import type { JSX } from 'react';
import { flushSync } from 'react-dom';
import {
  FormInput,
  FormSelect,
  writeInputChecked,
  writeRadioGroup,
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
    write: (checked) => {
      if (check.current) {
        writeInputChecked(check.current, checked);
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
  const radioChecks = (): boolean[] => [
    radioA.current?.checked ?? false,
    radioB.current?.checked ?? false,
  ];
  const radio = useFormValue<string | null>({
    value: local ? undefined : value,
    defaultValue: 'a',
    getControl: () => radioA.current,
    write: (next) => {
      if (radioA.current && radioB.current && radioA.current.form === radioB.current.form) {
        writeRadioGroup([radioA.current, radioB.current], next);
      }
    },
    onChange: (next) => {
      record(local ? 'local radio' : 'radio', next, radioA.current, radioChecks());
      if (accept) {
        flushSync(() => setValue('b'));
        record('radio committed', 'b', radioA.current, radioChecks());
      }
    },
  });
  return (
    <form id="radios">
      <label>
        <FormInput
          ref={radioA}
          type="radio"
          name="radio"
          value="a"
          defaultChecked
          onChange={(event) => radio.propose('a', event.currentTarget)}
        />
        Radio A
      </label>
      <label>
        <FormInput
          ref={radioB}
          type="radio"
          name="radio"
          value="b"
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
    </form>
  );
}

export default function StrictAuthorityFixture(): JSX.Element {
  return (
    <StrictMode>
      <AuthorityFixture />
    </StrictMode>
  );
}
