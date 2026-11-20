import { useRef, useState } from 'react';
import type { JSX } from 'react';
import {
  FormInput,
  FormSelect,
  writeInputChecked,
  writeInputValue,
} from '../../src/core/forms/carriers.js';
import type { CarrierOption } from '../../src/core/forms/carriers.js';
import { useFormValue } from '../../src/core/forms/useFormValue.js';
import { useFixtureSelect } from './form-fixture-helpers.js';

const catalog = [{ value: 'a' }, { value: 'b' }, { value: '' }] satisfies CarrierOption[];

interface ChoiceProps {
  name: string;
  defaultValue?: string | null;
  external?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
}

function Choice({
  name,
  defaultValue = null,
  external,
  disabled,
  readOnly,
  required,
}: ChoiceProps): JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const [filtered, setFiltered] = useState(false);
  const options = catalog
    .filter((item) => !filtered || item.value !== 'b')
    .map((item) => ({ ...item, disabled: unavailable && item.value === 'b' }));
  const choiceCarrier = useRef<HTMLSelectElement>(null);
  const choice = useFixtureSelect(choiceCarrier, { defaultValue, catalog: options, readOnly });
  return (
    <div>
      <button ref={trigger} type="button" disabled={disabled} onClick={() => setOpen(!open)}>
        {name} choices
      </button>
      <FormSelect
        ref={choiceCarrier}
        name={name}
        form={external}
        disabled={disabled}
        required={required}
        initialValue={choice.value}
        options={options}
        getFocusTarget={() => trigger.current}
      />
      {open && (
        <div>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              disabled={disabled || option.disabled}
              onClick={() => {
                choice.propose(option.value);
                setOpen(false);
              }}
            >
              {name} choose {option.value || 'empty string'}
            </button>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setUnavailable(!unavailable)}>
        {name} toggle availability
      </button>
      <button type="button" onClick={() => setFiltered(!filtered)}>
        {name} toggle filter
      </button>
    </div>
  );
}

function NativeInputs(): JSX.Element {
  const text = useRef<HTMLInputElement>(null);
  const check = useRef<HTMLInputElement>(null);
  const field = useFormValue<string>({
    defaultValue: 'initial',
    getControl: () => text.current,
    write: (value) => {
      if (text.current) {
        writeInputValue(text.current, value);
      }
    },
  });
  const toggle = useFormValue<boolean>({
    defaultValue: true,
    getControl: () => check.current,
    write: (checked) => {
      if (check.current) {
        writeInputChecked(check.current, checked);
      }
    },
  });
  return (
    <>
      <FormInput
        ref={text}
        name="text"
        aria-label="Text"
        defaultValue={field.value}
        onChange={(event) => field.propose(event.currentTarget.value)}
      />
      <FormInput
        ref={check}
        type="checkbox"
        name="check"
        aria-label="Check"
        value="yes"
        defaultChecked={toggle.value}
        onChange={(event) => toggle.propose(event.currentTarget.checked)}
      />
    </>
  );
}

export default function FormCarriersFixture(): JSX.Element {
  const multiTrigger = useRef<HTMLButtonElement>(null);
  const [multiOpen, setMultiOpen] = useState(false);
  const [filter, setFilter] = useState(false);
  const [fieldsetDisabled, setFieldsetDisabled] = useState(true);
  const [ownDisabled, setOwnDisabled] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [validation, setValidation] = useState<'two' | 'composite-first' | 'native-first'>('two');
  const multiCatalog = catalog.filter((item) => !filter || item.value !== 'b');
  const multiCarrier = useRef<HTMLSelectElement>(null);
  const multi = useFixtureSelect<readonly string[]>(multiCarrier, {
    defaultValue: [],
    catalog: multiCatalog,
  });
  return (
    <>
      <form id="values" onSubmit={(event) => event.preventDefault()}>
        <Choice name="single" disabled={ownDisabled} readOnly={readOnly} />
        <button ref={multiTrigger} type="button" onClick={() => setMultiOpen(!multiOpen)}>
          Multiple choices
        </button>
        <FormSelect
          ref={multiCarrier}
          name="multi"
          initialValue={multi.value}
          options={multiCatalog}
          getFocusTarget={() => multiTrigger.current}
        />
        {multiOpen && (
          <button
            type="button"
            onClick={() => {
              multi.propose(['b', 'a']);
              setMultiOpen(false);
            }}
          >
            Choose B then A
          </button>
        )}
        <NativeInputs />
        <button name="action" value="save" type="submit">
          Save values
        </button>
      </form>
      <button type="button" onClick={() => setFilter(!filter)}>
        Filter multiple
      </button>
      <button type="button" onClick={() => multi.propose([])}>
        Clear multiple
      </button>
      <button type="button" onClick={() => setOwnDisabled(!ownDisabled)}>
        Toggle own disabled
      </button>
      <button type="button" onClick={() => setReadOnly(!readOnly)}>
        Toggle read only
      </button>

      <form id="external" onSubmit={(event) => event.preventDefault()}>
        <button name="action" value="send" type="submit">
          Send external
        </button>
      </form>
      <button type="button" onClick={() => setFieldsetDisabled(!fieldsetDisabled)}>
        Toggle fieldset
      </button>
      <fieldset disabled={fieldsetDisabled}>
        <legend>
          <Choice name="first" external="external" defaultValue="a" />
        </legend>
        <legend>
          <Choice name="second" external="external" defaultValue="a" />
        </legend>
        <Choice name="plain" external="external" defaultValue="a" />
      </fieldset>

      <button type="button" onClick={() => setValidation('two')}>
        Two composite fields
      </button>
      <button type="button" onClick={() => setValidation('composite-first')}>
        Composite first
      </button>
      <button type="button" onClick={() => setValidation('native-first')}>
        Native first
      </button>
      <form key={validation} id="validation" onSubmit={(event) => event.preventDefault()}>
        {validation === 'native-first' && (
          <input name="native" aria-label="Native required" required />
        )}
        <Choice name="required A" required />
        {validation === 'two' && <Choice name="required B" required />}
        {validation === 'composite-first' && (
          <input name="native" aria-label="Native required" required />
        )}
        <button type="submit">Submit required</button>
      </form>
      <form id="required-multiple" onSubmit={(event) => event.preventDefault()}>
        <RequiredMultiple />
        <button type="submit">Submit required multiple</button>
      </form>
      <form id="required-input" onSubmit={(event) => event.preventDefault()}>
        <RequiredInput />
        <button type="submit">Submit required input</button>
      </form>
    </>
  );
}

function RequiredMultiple(): JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  const multiCarrier = useRef<HTMLSelectElement>(null);
  const multi = useFixtureSelect<readonly string[]>(multiCarrier, { defaultValue: [], catalog });
  return (
    <>
      <button ref={trigger} type="button" onClick={() => multi.propose(['b', 'a'])}>
        Required multiple choices
      </button>
      <FormSelect
        ref={multiCarrier}
        name="multiple"
        required
        initialValue={multi.value}
        options={catalog}
        getFocusTarget={() => trigger.current}
      />
    </>
  );
}

function RequiredInput(): JSX.Element {
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const field = useFormValue<string>({
    defaultValue: '',
    getControl: () => input.current,
    write: (value) => {
      if (input.current) {
        writeInputValue(input.current, value);
      }
    },
  });
  return (
    <>
      <button ref={trigger} type="button" onClick={() => field.propose('123')}>
        Fill input code
      </button>
      <button type="button" onClick={() => field.propose('wrong')}>
        Fill invalid input code
      </button>
      <FormInput
        ref={input}
        name="code"
        required
        pattern="[0-9]{3}"
        defaultValue={field.value}
        getFocusTarget={() => trigger.current}
      />
    </>
  );
}
