import { useCallback, useRef, useState } from 'react';
import type { FormEvent, JSX, ReactNode } from 'react';
import { createPortal, flushSync } from 'react-dom';
import { Checkbox, CheckboxGroup, Switch, SwitchGroup } from '@docouno/unica';

interface Snapshot {
  readonly phase: string;
  readonly candidate: boolean | readonly string[];
  readonly entries: readonly (readonly [string, FormDataEntryValue])[];
  readonly valid: boolean;
}

function snapshot(
  form: HTMLFormElement,
  phase: string,
  candidate: Snapshot['candidate'],
): Snapshot {
  return { phase, candidate, entries: [...new FormData(form)], valid: form.checkValidity() };
}

function preventSubmit(event: FormEvent<HTMLFormElement>): void {
  event.preventDefault();
}

function MixedCheckboxes(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [checked, setChecked] = useState(false);
  const [accept, setAccept] = useState(false);
  const [localDefault, setLocalDefault] = useState(true);
  const [log, setLog] = useState<readonly Snapshot[]>([]);

  function record(phase: string, next: boolean): void {
    if (form.current) {
      const entry = snapshot(form.current, phase, next);
      setLog((previous) => [...previous, entry]);
    }
  }

  return (
    <form ref={form} aria-label="Mixed checkboxes" onSubmit={preventSubmit}>
      <button type="button" onClick={() => setAccept(true)}>
        Accept mixed proposal
      </button>
      <button type="button" onClick={() => setLocalDefault(false)}>
        Change mixed default
      </button>
      <Checkbox
        label="Controlled mixed"
        name="controlled"
        checked={checked}
        required
        indeterminate
        onCheckedChange={(next) => {
          record('proposed', next);
          if (accept) {
            flushSync(() => setChecked(next));
            record('committed', next);
          }
        }}
        onChange={(event) => record('raw', event.currentTarget.checked)}
      />
      <Checkbox
        label="Local mixed"
        name="local"
        value=""
        defaultChecked={localDefault}
        indeterminate
        onCheckedChange={(next) => record('local', next)}
      />
      <button type="reset">Reset mixed choices</button>
      <output data-testid="mixed-log">{JSON.stringify(log)}</output>
    </form>
  );
}

function CanceledActivation(): JSX.Element {
  const [commit, setCommit] = useState(false);
  const [changes, setChanges] = useState(0);
  const [delegated, setDelegated] = useState<{
    readonly count: number;
    readonly name: string;
    readonly entries: readonly (readonly [string, FormDataEntryValue])[];
  }>({ count: 0, name: '', entries: [] });
  const [proposals, setProposals] = useState<readonly boolean[]>([]);
  return (
    <form
      aria-label="Canceled activation form"
      onSubmit={preventSubmit}
      onChange={(event) => {
        const name = event.target instanceof HTMLInputElement ? event.target.name : '';
        const entries = [...new FormData(event.currentTarget)];
        setDelegated((previous) => ({ count: previous.count + 1, name, entries }));
      }}
    >
      <Checkbox
        name="local"
        label="Cancel at document"
        onCheckedChange={() => setChanges((count) => count + 1)}
        onChange={() => setChanges((count) => count + 1)}
      />
      <Checkbox
        name="controlled"
        label="Accept props during a canceled click"
        checked={commit}
        onClick={(event) => {
          if (!commit) {
            event.preventDefault();
            flushSync(() => setCommit(true));
          }
        }}
        onCheckedChange={(next) => {
          setProposals((previous) => [...previous, next]);
          setChanges((count) => count + 1);
        }}
        onChange={() => setChanges((count) => count + 1)}
      />
      <Checkbox name="refused" label="Refuse the controlled proposal" checked={false} />
      <div onInputCapture={(event) => event.stopPropagation()}>
        <Checkbox
          name="stopped"
          label="Stop the input event"
          onCheckedChange={() => setChanges((count) => count + 1)}
          onChange={() => setChanges((count) => count + 1)}
        />
      </div>
      <Checkbox
        name="quiet"
        label="Silence native confirmation"
        onCheckedChange={(next) => setProposals((previous) => [...previous, next])}
      />
      <button type="button" onClick={() => setCommit(false)}>
        Reset controlled commit
      </button>
      <output data-testid="canceled-activation">{changes}</output>
      <output data-testid="delegated-activation">{JSON.stringify(delegated)}</output>
      <output data-testid="activation-proposals">{JSON.stringify(proposals)}</output>
    </form>
  );
}

function ToggleFieldset({ children }: { readonly children: ReactNode }): JSX.Element {
  const [disabled, setDisabled] = useState(false);
  const fieldset = useRef<HTMLFieldSetElement>(null);
  const afterCommit = useRef<HTMLOutputElement>(null);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          flushSync(() => setDisabled(!disabled));
          const owner = fieldset.current?.form;
          if (owner && afterCommit.current) {
            afterCommit.current.value = JSON.stringify(
              snapshot(owner, 'outer fieldset commit', !disabled),
            );
          }
        }}
      >
        Toggle outer fieldset
      </button>
      <fieldset ref={fieldset} disabled={disabled} data-testid="outer-fieldset">
        {children}
      </fieldset>
      <output hidden ref={afterCommit} data-testid="outer-fieldset-commit" />
    </>
  );
}

function MinimumGroup(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const alpha = useRef<HTMLInputElement>(null);
  const beta = useRef<HTMLInputElement>(null);
  const setAlphaValidity = useRef<((message: string) => void) | null>(null);
  const captureAlpha = useCallback((input: HTMLInputElement | null) => {
    alpha.current = input;
    setAlphaValidity.current = input ? input.setCustomValidity.bind(input) : null;
  }, []);
  const [capturedValidity, setCapturedValidity] = useState<readonly (string | boolean)[]>([]);
  const submits = useRef(0);
  const [betaDisabled, setBetaDisabled] = useState(false);
  const [customError, setCustomError] = useState(false);
  const [immediateValid, setImmediateValid] = useState(true);
  const [log, setLog] = useState<readonly (Snapshot & { readonly submits: number })[]>([]);
  const [submitted, setSubmitted] = useState(0);

  // Stable children isolate the fieldset's commit from the group's React subtree.
  const alphaBranch = (
    <>
      <legend>Fieldset legend</legend>
      <Checkbox ref={captureAlpha} label="Alpha" value="a" />
    </>
  );
  const [fieldsetChildren] = useState(() => alphaBranch);

  function record(next: string[]): void {
    if (form.current) {
      const entry = snapshot(form.current, 'group', next);
      form.current.requestSubmit();
      const withSubmit = { ...entry, submits: submits.current };
      setLog((previous) => [...previous, withSubmit]);
    }
  }

  return (
    <form
      ref={form}
      aria-label="Minimum checkbox form"
      onSubmit={(event) => {
        event.preventDefault();
        submits.current += 1;
        setSubmitted(submits.current);
      }}
    >
      <button
        type="button"
        onClick={() => {
          const write = setAlphaValidity.current;
          const input = alpha.current;
          if (write && input?.form) {
            write('Server error');
            const applicationMessage = input.validationMessage;
            write('');
            const valid = input.form.checkValidity();
            input.form.requestSubmit();
            setCapturedValidity([applicationMessage, input.validationMessage, valid]);
          }
        }}
      >
        Clear captured custom validity
      </button>
      <button
        type="button"
        onClick={() => {
          flushSync(() => setBetaDisabled(!betaDisabled));
          setImmediateValid(form.current?.checkValidity() ?? true);
        }}
      >
        Toggle participating beta
      </button>
      <button
        type="button"
        onClick={() => {
          const next = !customError;
          beta.current?.setCustomValidity(next ? 'Application error' : '');
          setCustomError(next);
        }}
      >
        Toggle beta custom error
      </button>
      <CheckboxGroup
        aria-label="Choose at least one"
        name="option"
        defaultValue={[]}
        required
        requiredMessage="Select a source"
        onValueChange={record}
      >
        <ToggleFieldset>{fieldsetChildren}</ToggleFieldset>
        <Checkbox ref={beta} label="Beta" value="b" disabled={betaDisabled} />
      </CheckboxGroup>
      <button type="submit">Submit minimum form</button>
      <output data-testid="minimum-log">{JSON.stringify(log)}</output>
      <output data-testid="immediate-valid">{String(immediateValid)}</output>
      <output data-testid="captured-validity">{JSON.stringify(capturedValidity)}</output>
      <output data-testid="submits">{submitted}</output>
    </form>
  );
}

function ControlledMinimumGroup(): JSX.Element {
  const form = useRef<HTMLFormElement>(null);
  const [value, setValue] = useState<readonly string[]>([]);
  const [accept, setAccept] = useState(false);
  const [log, setLog] = useState<readonly Snapshot[]>([]);

  return (
    <form ref={form} aria-label="Controlled minimum form" onSubmit={preventSubmit}>
      <button type="button" onClick={() => setAccept(true)}>
        Accept minimum proposal
      </button>
      <CheckboxGroup
        aria-label="Controlled minimum"
        name="minimum"
        required
        value={value}
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
        <Checkbox label="Controlled option" value="accepted" />
      </CheckboxGroup>
      <output data-testid="controlled-minimum-log">{JSON.stringify(log)}</output>
    </form>
  );
}

function ExternalForms(): JSX.Element {
  const [owner, setOwner] = useState('external-a');
  const [second, setSecond] = useState<HTMLFormElement | null>(null);
  const [portalIsLocal, setPortalIsLocal] = useState(false);

  return (
    <>
      <form id="external-a" aria-label="External A" onSubmit={preventSubmit} />
      <form id="external-b" ref={setSecond} aria-label="External B" onSubmit={preventSubmit} />
      <button
        type="button"
        onClick={() => setOwner(owner === 'external-a' ? 'external-b' : 'external-a')}
      >
        Move group owner
      </button>
      <button type="button" onClick={() => setPortalIsLocal(!portalIsLocal)}>
        Move portal to group
      </button>
      <form aria-label="Portal owner" onSubmit={preventSubmit}>
        <CheckboxGroup
          name="portal"
          aria-label="Group with portal"
          defaultValue={['local', 'portal']}
        >
          <Checkbox label="Local member" value="local" />
          {portalIsLocal ? (
            <Checkbox label="Portal member" value="portal" />
          ) : (
            second && createPortal(<Checkbox label="Portal member" value="portal" />, second)
          )}
        </CheckboxGroup>
      </form>
      <SwitchGroup
        aria-label="Moving switch group"
        name="setting"
        form={owner}
        defaultValue={['a']}
      >
        <Switch label="Setting A" name="ignored" form="missing-owner" value="a" />
        <Switch label="Setting B" value="b" />
      </SwitchGroup>
      <CheckboxGroup aria-label="Layout only" name="independent">
        <Checkbox label="Independent A" form="external-a" defaultChecked />
        <Checkbox label="Independent B" form="external-b" defaultChecked />
      </CheckboxGroup>
      <form aria-label="Legend form" onSubmit={preventSubmit}>
        <fieldset disabled>
          <legend>
            <Checkbox label="Legend selection" name="inside" defaultChecked />
          </legend>
          <Checkbox label="Disabled body selection" name="outside" defaultChecked />
        </fieldset>
      </form>
    </>
  );
}

export default function BinaryFormsFixture(): JSX.Element {
  return (
    <>
      <MixedCheckboxes />
      <CanceledActivation />
      <MinimumGroup />
      <ControlledMinimumGroup />
      <ExternalForms />
    </>
  );
}
