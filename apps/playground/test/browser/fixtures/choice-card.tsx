import {
  Checkbox,
  CheckboxCard,
  CheckboxCardGroup,
  CheckboxGroup,
  ChoiceCardContent,
  ChoiceCardDescription,
  ChoiceCardLabel,
  ChoiceCardSecondary,
  Flex,
  Radio,
  RadioCard,
  RadioCardGroup,
  RadioCardIndicator,
  RadioGroup,
  Switch,
  SwitchCard,
  SwitchGroup,
} from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import type { JSX } from 'react';

interface RadioPairProps {
  readonly placement: 'start' | 'none';
  readonly controlled?: boolean;
}

function RadioPair({ placement, controlled }: RadioPairProps): JSX.Element {
  const id = useId();
  const [committed, setCommitted] = useState('a');
  const [accept, setAccept] = useState(false);
  const [changes, setChanges] = useState(0);
  const [details, setDetails] = useState(false);
  return (
    <form aria-label={`${controlled ? 'Controlled' : 'Native'} ${placement}`}>
      <button type="reset">Reset answer</button>
      {controlled && (
        <button type="button" onClick={() => setAccept(true)}>
          Accept changes
        </button>
      )}
      <RadioCardGroup
        name="policy"
        aria-label="Policy"
        value={controlled ? committed : undefined}
        defaultValue="a"
        onValueChange={(value) => {
          setChanges((count) => count + 1);
          if (controlled && accept) {
            setCommitted(value);
          }
        }}
      >
        {(['a', 'b'] as const).map((value) => {
          const label = value === 'a' ? 'First answer' : 'Second answer';
          const title = `${id}-${value}-title`;
          const description = `${id}-${value}-description`;
          return placement === 'none' ? (
            <RadioCard
              key={value}
              value={value}
              indicatorPlacement={placement}
              aria-labelledby={title}
              aria-describedby={description}
            >
              <ChoiceCardContent>
                <ChoiceCardLabel id={title}>
                  {label} <RadioCardIndicator />
                </ChoiceCardLabel>
                <ChoiceCardDescription id={description}>
                  Read about this policy.
                </ChoiceCardDescription>
                {value === 'b' && (
                  <ChoiceCardSecondary>
                    <button type="button" onClick={() => setDetails(true)}>
                      Show details
                    </button>
                  </ChoiceCardSecondary>
                )}
              </ChoiceCardContent>
            </RadioCard>
          ) : (
            <RadioCard key={value} value={value} label={label} />
          );
        })}
      </RadioCardGroup>
      <output data-testid="changes">{changes}</output>
      {details && <p>Details opened</p>}
    </form>
  );
}

function RadioEntry({ compact }: { readonly compact: boolean }): JSX.Element {
  const [terms, setTerms] = useState(0);
  const [changes, setChanges] = useState(0);
  const [disabled, setDisabled] = useState(false);
  const Group = compact ? RadioGroup : RadioCardGroup;
  return (
    <form aria-label={compact ? 'Mixed radio entry' : 'Card radio entry'}>
      <button type="button">Before choices</button>
      <Group
        name="radio-entry"
        disabled={disabled}
        defaultValue="a"
        aria-label="Entry policies"
        onValueChange={() => setChanges(changes + 1)}
      >
        <RadioCard
          value="a"
          disabled
          label="Unavailable policy"
          secondary={
            <a
              href="#terms"
              onClick={(event) => {
                event.preventDefault();
                setTerms(terms + 1);
              }}
            >
              Terms A
            </a>
          }
        />
        {compact ? (
          <Radio value="b" label="Available policy" />
        ) : (
          <RadioCard value="b" label="Available policy" />
        )}
      </Group>
      <button type="button">After choices</button>
      <button type="button" onClick={() => setDisabled(!disabled)}>
        Toggle radio availability
      </button>
      <output data-testid="entry-log">{JSON.stringify({ terms, changes })}</output>
    </form>
  );
}

function PendingSwitch(): JSX.Element {
  const fieldset = useRef<HTMLFieldSetElement>(null);
  const [value, setValue] = useState(true);
  const [pending, setPending] = useState<boolean | null>(null);
  const [proposals, setProposals] = useState<boolean[]>([]);
  const [submissions, setSubmissions] = useState(0);
  return (
    <form
      aria-label="Pending integration"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmissions(submissions + 1);
      }}
    >
      <button
        type="button"
        onClick={() => {
          const element = fieldset.current;
          if (element) {
            element.disabled = !element.disabled;
          }
        }}
      >
        Toggle integration availability
      </button>
      <fieldset ref={fieldset}>
        <SwitchCard
          name="sync"
          label="Sync updates"
          checked={value}
          loading={pending !== null}
          onCheckedChange={(next) => {
            setPending(next);
            setProposals([...proposals, next]);
          }}
        />
      </fieldset>
      <button
        type="button"
        onClick={() => {
          if (pending !== null) {
            setValue(pending);
          }
          setPending(null);
        }}
      >
        Confirm update
      </button>
      <button type="button" onClick={() => setPending(null)}>
        Reject update
      </button>
      <button type="submit">Submit integration</button>
      <output data-testid="pending-log">{JSON.stringify({ proposals, submissions })}</output>
    </form>
  );
}

function CheckboxForm({ compact }: { readonly compact: boolean }): JSX.Element {
  const id = useId();
  const [disabled, setDisabled] = useState(false);
  const [termsAvailable, setTermsAvailable] = useState(true);
  const [inert, setInert] = useState<'none' | 'card' | 'parent'>('none');
  const [log, setLog] = useState({
    choices: [] as boolean[],
    terms: 0,
    changes: 0,
    submissions: 0,
  });
  const Group = compact ? CheckboxGroup : CheckboxCardGroup;
  return (
    <>
      <form
        id={id}
        aria-label={compact ? 'Compact checkbox form' : 'Card checkbox form'}
        onSubmit={(event) => {
          event.preventDefault();
          setLog((previous) => ({ ...previous, submissions: previous.submissions + 1 }));
        }}
      >
        <button type="submit">Submit options</button>
        <button type="reset">Reset options</button>
        <button type="button" onClick={() => setDisabled(!disabled)}>
          Toggle group
        </button>
        <button type="button" onClick={() => setTermsAvailable(!termsAvailable)}>
          Toggle terms
        </button>
        <button
          type="button"
          onClick={() => setInert(inert === 'none' ? 'card' : inert === 'card' ? 'parent' : 'none')}
        >
          Cycle inert
        </button>
        <output data-testid="checkbox-log">{JSON.stringify(log)}</output>
      </form>
      <Group
        form={id}
        name="include"
        required
        disabled={disabled}
        aria-label={compact ? 'Compact included formats' : 'Card included formats'}
      >
        <div inert={inert === 'parent'}>
          <CheckboxCard
            value="pdf"
            label="PDF"
            description="Preserve the print layout."
            metadata="Included"
            inert={inert === 'card'}
            onCheckedChange={(next) =>
              setLog((previous) => ({ ...previous, choices: [...previous.choices, next] }))
            }
            onChange={() => setLog((previous) => ({ ...previous, changes: previous.changes + 1 }))}
            secondary={
              <Flex align="center" gap={24}>
                {termsAvailable && (
                  <a
                    href="#terms"
                    onClick={(event) => {
                      event.preventDefault();
                      setLog((previous) => ({ ...previous, terms: previous.terms + 1 }));
                    }}
                  >
                    Read terms
                  </a>
                )}
                <button type="button" disabled>
                  Configure
                </button>
              </Flex>
            }
          />
        </div>
        <Checkbox value="source" label="Source files" />
      </Group>
    </>
  );
}

function ControlledSwitches(): JSX.Element {
  const [enabled, setEnabled] = useState(['mail']);
  const [proposals, setProposals] = useState<string[][]>([]);
  const [accept, setAccept] = useState(false);
  const [disabled, setDisabled] = useState(false);
  return (
    <form aria-label="Mixed notifications">
      <button type="button" onClick={() => setAccept(true)}>
        Accept notification changes
      </button>
      <button type="button" onClick={() => setDisabled(!disabled)}>
        Toggle notifications availability
      </button>
      <SwitchGroup
        name="notify"
        value={enabled}
        disabled={disabled}
        aria-label="Notifications"
        onValueChange={(next) => {
          setProposals([...proposals, next]);
          if (accept) {
            setEnabled(next);
          }
        }}
      >
        <Switch value="mail" label="Email" />
        <SwitchCard
          value="digest"
          label="Digest"
          secondary={<a href="#schedule">Notification schedule</a>}
        />
      </SwitchGroup>
      <output data-testid="proposals">{JSON.stringify(proposals)}</output>
    </form>
  );
}

function BackgroundChoices(): JSX.Element {
  const dialog = useRef<HTMLDialogElement>(null);
  const [mounted, setMounted] = useState(false);
  const [read, setRead] = useState(false);
  return (
    <>
      <button type="button" onClick={() => dialog.current?.showModal()}>
        Open unrelated modal
      </button>
      <dialog ref={dialog} aria-label="Unrelated modal">
        <button type="button" onClick={() => setMounted(true)}>
          Mount background choices
        </button>
        <button type="button" onClick={() => dialog.current?.close()}>
          Close unrelated modal
        </button>
      </dialog>
      {mounted && (
        <CheckboxCardGroup disabled aria-label="Background options">
          <CheckboxCard
            label="Include the preview"
            secondary={
              <a
                href="#preview-policy"
                onClick={(event) => {
                  event.preventDefault();
                  setRead(true);
                }}
              >
                Read preview conditions
              </a>
            }
          />
        </CheckboxCardGroup>
      )}
      {read && <p>Preview conditions opened</p>}
    </>
  );
}

export default function ChoiceCardFixture(): JSX.Element {
  return (
    <>
      <RadioPair placement="start" />
      <RadioPair placement="none" />
      <RadioPair placement="start" controlled />
      <RadioPair placement="none" controlled />
      <RadioEntry compact={false} />
      <RadioEntry compact />
      <PendingSwitch />
      <CheckboxForm compact={false} />
      <CheckboxForm compact />
      <ControlledSwitches />
      <BackgroundChoices />
      <CheckboxCardGroup
        orientation="horizontal"
        aria-label="Short choices"
        style={{ inlineSize: 'min(100%, 400px)' }}
      >
        <CheckboxCard size="s" label="PDF" />
        <CheckboxCard size="s" label="CSV" />
      </CheckboxCardGroup>
    </>
  );
}
