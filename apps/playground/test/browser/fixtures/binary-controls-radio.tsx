import { useRef, useState } from 'react';
import type { FormEvent, JSX } from 'react';
import { flushSync } from 'react-dom';
import { Radio, RadioGroup } from '@docouno/unica';

interface RadioSnapshot {
  readonly phase: string;
  readonly candidate: string;
  readonly entries: readonly (readonly [string, FormDataEntryValue])[];
  readonly checked: readonly boolean[];
}

function snapshot(form: HTMLFormElement, phase: string, candidate: string): RadioSnapshot {
  return {
    phase,
    candidate,
    entries: [...new FormData(form)],
    checked: Array.from(
      form.querySelectorAll<HTMLInputElement>('input[type="radio"]'),
      ({ checked }) => checked,
    ),
  };
}

function preventSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

function DisabledSelection(): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const [changes, setChanges] = useState(0);
  return (
    <form aria-label="Disabled selected radio form" onSubmit={preventSubmit}>
      <button type="button">Before radio group</button>
      <RadioGroup
        aria-label="Disabled selected radio"
        name="selected"
        required
        defaultValue="a"
        onValueChange={() => setChanges((count) => count + 1)}
      >
        <Radio label="Original selection" value="a" disabled={disabled} />
        <Radio label="Unavailable alternative" value="b" disabled />
        <Radio label="Available replacement" value="" />
      </RadioGroup>
      <button type="button">After radio group</button>
      <button type="button" onClick={() => setDisabled(!disabled)}>
        Disable original selection
      </button>
      <output data-testid="entry-changes">{changes}</output>
    </form>
  );
}

function DirectionComparison(): JSX.Element {
  return (
    <>
      <form aria-label="Native radio direction" onSubmit={preventSubmit}>
        <label>
          <input name="choice" type="radio" value="first" />
          Native first
        </label>
        <label>
          <input name="choice" type="radio" value="middle" defaultChecked />
          Native middle
        </label>
        <label>
          <input name="choice" type="radio" value="last" />
          Native last
        </label>
      </form>
      <form aria-label="Unica radio direction" onSubmit={preventSubmit}>
        <RadioGroup
          aria-label="Radio direction"
          name="choice"
          defaultValue="middle"
          orientation="horizontal"
        >
          <Radio label="Unica first" value="first" />
          <Radio label="Unica middle" value="middle" />
          <Radio label="Unica last" value="last" />
        </RadioGroup>
      </form>
    </>
  );
}

function ControlledGroup(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState('a');
  const [accept, setAccept] = useState(false);
  const [readOnly, setReadOnly] = useState(false);
  const [log, setLog] = useState<readonly RadioSnapshot[]>([]);

  return (
    <form ref={form} aria-label="Controlled radio group form" onSubmit={preventSubmit}>
      <button type="button" onClick={() => setAccept(true)}>
        Accept radio proposal
      </button>
      <button type="button" onClick={() => setReadOnly(true)}>
        Lock controlled radio group
      </button>
      <RadioGroup
        aria-label="Controlled radio group"
        name="controlled"
        value={value}
        readOnly={readOnly}
        onKeyDown={(event) => {
          if (event.key === 'Home') {
            event.stopPropagation();
          }
        }}
        onValueChange={(next) => {
          const owner = form.current;
          if (!owner) {
            return;
          }
          const before = snapshot(owner, 'proposed', next);
          if (accept) {
            flushSync(() => setValue(next));
          }
          const after = snapshot(owner, 'after owner', next);
          setLog((previous) => [...previous, before, after]);
        }}
      >
        <Radio label="Controlled Radio A" value="a" />
        <Radio label="Controlled Radio B" value="b" disabled />
        <Radio label="Controlled Radio C" value="c" />
        <Radio label="Controlled Radio D" value="d" />
      </RadioGroup>
      <output data-testid="radio-group-log">{JSON.stringify(log)}</output>
    </form>
  );
}

function StandaloneRadios(): JSX.Element {
  const [accept, setAccept] = useState(false);
  const [selected, setSelected] = useState('a');
  const [log, setLog] = useState<readonly RadioSnapshot[]>([]);
  const [delegated, setDelegated] = useState<RadioSnapshot>();

  return (
    <>
      <form id="standalone-radio-form" aria-label="Standalone radios" onSubmit={preventSubmit} />
      <form aria-label="Other standalone owner" onSubmit={preventSubmit}>
        <Radio label="Other standalone" name="peer" value="owned elsewhere" defaultChecked />
      </form>
      <button type="button" onClick={() => setAccept(true)}>
        Accept standalone proposal
      </button>
      {['a', 'b'].map((value) => (
        <Radio
          key={value}
          label={`Standalone ${value.toUpperCase()}`}
          name="peer"
          form="standalone-radio-form"
          value={value}
          checked={selected === value}
          onChange={(event) => {
            const candidate = event.currentTarget;
            const owner = candidate.form;
            if (!owner) {
              return;
            }
            const entry = {
              phase: 'proposed',
              candidate: candidate.value,
              entries: [...new FormData(owner)],
              checked: Array.from(
                owner.elements,
                (element) => (element as HTMLInputElement).checked,
              ),
            };
            if (accept) {
              flushSync(() => setSelected(value));
            }
            setLog((previous) => [...previous, entry]);
          }}
        />
      ))}
      <form aria-label="Uncontrolled peers" onSubmit={preventSubmit}>
        <Radio label="Local peer A" name="peer" value="a" defaultChecked />
        <Radio label="Local peer B" name="peer" value="b" />
        <button type="reset">Reset local peers</button>
      </form>
      <form
        aria-label="Pinned standalone set"
        onSubmit={preventSubmit}
        onChange={(event) => {
          if (event.target instanceof HTMLInputElement) {
            setDelegated(snapshot(event.currentTarget, 'delegated', event.target.value));
          }
        }}
      >
        <Radio label="Pinned choice" name="pinned" value="a" checked />
        <Radio label="Local alternative" name="pinned" value="b" />
      </form>
      <output data-testid="standalone-radio-log">{JSON.stringify(log)}</output>
      <output data-testid="pinned-radio-log">{JSON.stringify(delegated)}</output>
    </>
  );
}

function GeneratedNames(): JSX.Element {
  return (
    <form aria-label="Generated radio names" onSubmit={preventSubmit}>
      <RadioGroup aria-label="Omitted name">
        <Radio label="Omitted A" value="a" />
        <Radio label="Omitted B" value="b" />
      </RadioGroup>
      <RadioGroup aria-label="Empty name" name="">
        <Radio label="Empty A" value="" />
        <Radio label="Empty B" value="b" />
      </RadioGroup>
    </form>
  );
}

function ReassociatedRadios(): JSX.Element {
  const [join, setJoin] = useState(false);
  const [version, setVersion] = useState(0);
  const [firstChanges, setFirstChanges] = useState(0);
  return (
    <form aria-label="Reassociated standalone radios" onSubmit={preventSubmit}>
      <Radio
        label="Reassociated first"
        name="primary"
        value="first"
        defaultChecked
        onCheckedChange={() => setFirstChanges((current) => current + 1)}
      />
      <Radio
        label="Reassociated second"
        name={join ? 'primary' : 'secondary'}
        value="second"
        defaultChecked
      />
      <label>
        <input type="radio" name="primary" value="native" />
        Plain native peer
      </label>
      <button type="button" onClick={() => setJoin(true)}>
        Merge standalone peers
      </button>
      <button type="button" onClick={() => setVersion((current) => current + 1)}>
        Rerender peer form {version}
      </button>
      <output data-testid="reassociated-first-changes">{firstChanges}</output>
    </form>
  );
}

function GroupOwners(): JSX.Element {
  return (
    <>
      <form id="radio-source" aria-label="Source radio owner" onSubmit={preventSubmit}>
        <RadioGroup aria-label="Source choices" name="collision" defaultValue="a">
          <Radio label="Source A" value="a" />
        </RadioGroup>
      </form>
      <form id="radio-destination" aria-label="Destination radio owner" onSubmit={preventSubmit}>
        <RadioGroup aria-label="Destination choices" name="collision" required defaultValue="b">
          <Radio label="Destination B" value="b" />
        </RadioGroup>
      </form>
      <form id="radio-standalone" aria-label="Standalone destination" onSubmit={preventSubmit}>
        <Radio label="Standalone retained" name="collision" value="standalone" defaultChecked />
      </form>
      <form aria-label="Unanswered required group" onSubmit={preventSubmit}>
        <RadioGroup aria-label="Required choices" name="collision" required value={null}>
          <Radio label="Required option" value="required" />
        </RadioGroup>
      </form>
      <form id="radio-optional" aria-label="Optional destination" onSubmit={preventSubmit}>
        <RadioGroup aria-label="Optional choices" name="collision" value={null}>
          <Radio label="Optional option" value="optional" />
        </RadioGroup>
      </form>
    </>
  );
}

export default function BinaryRadioFixture(): JSX.Element {
  return (
    <>
      <DisabledSelection />
      <DirectionComparison />
      <ControlledGroup />
      <StandaloneRadios />
      <GeneratedNames />
      <ReassociatedRadios />
      <GroupOwners />
    </>
  );
}
