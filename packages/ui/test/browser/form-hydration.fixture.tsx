import { StrictMode, useId, useRef, useState } from 'react';
import type { JSX } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { useIsoLayoutEffect } from '../../src/core/useIsoLayoutEffect.js';
import {
  FormInput,
  FormSelect,
  writeInputChecked,
  writeInputValue,
} from '../../src/core/forms/carriers.js';
import { useFormValue } from '../../src/core/forms/useFormValue.js';
import { useFixtureSelect } from './form-fixture-helpers.js';

const catalog = [{ value: 'a' }, { value: 'b' }, { value: 'c' }];

export function HydratedControls(): JSX.Element {
  const id = useId();
  const trigger = useRef<HTMLButtonElement>(null);
  const checkbox = useRef<HTMLInputElement>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const form = useRef<HTMLFormElement>(null);
  const changes = useRef(0);
  const [accepted, setAccepted] = useState('a');
  const [hydratedText, setHydratedText] = useState('hello');
  const options = { catalog, onChange: () => changes.current++ };
  const singleCarrier = useRef<HTMLSelectElement>(null);
  const single = useFixtureSelect<string>(singleCarrier, {
    ...options,
    defaultValue: 'a',
    value: accepted,
  });
  const multiCarrier = useRef<HTMLSelectElement>(null);
  const multi = useFixtureSelect<readonly string[]>(multiCarrier, {
    ...options,
    defaultValue: ['b', 'a'],
  });
  const emptyCarrier = useRef<HTMLSelectElement>(null);
  const empty = useFixtureSelect<string | null>(emptyCarrier, { ...options, defaultValue: null });
  const check = useFormValue<boolean>({
    defaultValue: true,
    getControl: () => checkbox.current,
    write: (checked, context) => {
      if (checkbox.current) {
        writeInputChecked(checkbox.current, checked, {
          syncDefault: context.controlled,
          force: context.force,
        });
      }
    },
    onChange: () => changes.current++,
  });
  const text = useFormValue<string>({
    value: hydratedText,
    defaultValue: 'hello',
    commitMode: 'deferred',
    getControl: () => textInput.current,
    write: (value, context) => {
      if (textInput.current) {
        writeInputValue(textInput.current, value, {
          syncDefault: context.controlled,
          force: context.force,
        });
      }
    },
    onChange: (next) => {
      setHydratedText(next);
    },
  });

  useIsoLayoutEffect(() => {
    if (form.current) {
      form.current.dataset.hydrated = '';
      form.current.dataset.changes = String(changes.current);
    }
  });

  return (
    <form id={id} ref={form} data-testid="hydrated-form">
      <button ref={trigger} id={id + '-trigger'} type="button" onClick={() => setAccepted('c')}>
        Commit C
      </button>
      <FormSelect
        ref={singleCarrier}
        name="single"
        initialValue={single.value}
        initialOptions={catalog}
        getFocusTarget={() => trigger.current}
      />
      <FormSelect
        ref={multiCarrier}
        name="multi"
        initialValue={multi.value}
        initialOptions={catalog}
        getFocusTarget={() => trigger.current}
      />
      <FormSelect
        ref={emptyCarrier}
        name="empty"
        initialValue={empty.value}
        initialOptions={catalog}
        getFocusTarget={() => trigger.current}
      />
      <FormInput
        ref={checkbox}
        controlled={check.controlled}
        name="checked"
        type="checkbox"
        defaultChecked={check.value}
        aria-label="Hydration check"
        value="yes"
        onChange={(event) => check.propose(event.currentTarget.checked)}
      />
      <FormInput
        ref={textInput}
        controlled={text.controlled}
        name="hydratedText"
        aria-label="Hydrated controlled text"
        defaultValue={text.value}
        onChange={(event) => text.propose(event.currentTarget.value)}
      />
      <button type="button" onClick={() => setHydratedText('world')}>
        Set hydrated text world
      </button>
      <output data-testid="hydrated-text-value">{text.value}</output>
      <button type="button" onClick={() => multi.propose(['c'])}>
        Propose multi C
      </button>
      <button type="button" onClick={() => empty.propose('b')}>
        Propose single B
      </button>
    </form>
  );
}

export default function HydrationFixture(): JSX.Element {
  const container = useRef<HTMLDivElement>(null);
  const errors = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          if (container.current) {
            hydrateRoot(
              container.current,
              <StrictMode>
                <HydratedControls />
              </StrictMode>,
              {
                onRecoverableError: (error) => {
                  if (errors.current) {
                    errors.current.textContent += String(error);
                  }
                },
              },
            );
          }
        }}
      >
        Hydrate form
      </button>
      <div data-testid="ssr-root" ref={container} />
      <output data-testid="hydration-errors" ref={errors} />
    </>
  );
}
