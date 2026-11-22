import { useRef, useState } from 'react';
import type { JSX } from 'react';
import {
  ChoiceCardSecondary,
  RadioCard,
  RadioCardContent,
  RadioCardIndicator,
  RadioCardLabel,
  SwitchCard,
} from '../../../src/prototypes/choice-card/choice-card.proto.js';

interface RadioPairProps {
  readonly placement: 'start' | 'none';
  readonly controlled?: boolean;
}

function RadioPair({ placement, controlled }: RadioPairProps): JSX.Element {
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
      <div role="radiogroup" aria-label="Policy">
        {(['a', 'b'] as const).map((value) => {
          const label = value === 'a' ? 'First answer' : 'Second answer';
          return (
            <RadioCard
              key={value}
              name="policy"
              value={value}
              indicatorPlacement={placement}
              label={label}
              {...(controlled
                ? { checked: committed === value }
                : { defaultChecked: value === 'a' })}
              onChange={() => {
                setChanges((count) => count + 1);
                if (controlled && accept) {
                  setCommitted(value);
                }
              }}
            >
              {placement === 'none' ? (
                <RadioCardContent>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <RadioCardLabel>{label}</RadioCardLabel>
                    <RadioCardIndicator />
                  </div>
                  {value === 'b' && (
                    <ChoiceCardSecondary>
                      <button type="button" onClick={() => setDetails(true)}>
                        Show details
                      </button>
                    </ChoiceCardSecondary>
                  )}
                </RadioCardContent>
              ) : undefined}
            </RadioCard>
          );
        })}
      </div>
      <output data-testid="changes">{changes}</output>
      {details && <p>Details opened</p>}
    </form>
  );
}

export default function ChoiceCardFixture(): JSX.Element {
  const fieldset = useRef<HTMLFieldSetElement>(null);
  return (
    <>
      <RadioPair placement="start" />
      <RadioPair placement="none" />
      <RadioPair placement="start" controlled />
      <RadioPair placement="none" controlled />
      <form aria-label="Pending integration">
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
          <SwitchCard name="sync" label="Sync updates" defaultChecked loading />
        </fieldset>
      </form>
    </>
  );
}
