import { Progress, ProgressCircle, Spinner, THEME_PRESETS } from '@docouno/unica';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { hydrateRoot } from 'react-dom/client';

const amounts = [
  ['zero', 0],
  ['first', 1],
  ['one-cell', 12.5],
  ['partial-cell', 18.75],
  ['transfer', 42],
  ['advance', 64],
  ['last', 99.6],
  ['complete', 100],
  ['unknown', null],
] as const;
type Amount = (typeof amounts)[number][0];

export function ProgressHydration() {
  const [known, setKnown] = useState(true);
  return (
    <>
      <Progress value={known ? 42 : null} max={80} label="Archive" />
      <Progress value={29} label="Preview" />
      <button type="button" onClick={() => setKnown(false)}>
        Clear measurement
      </button>
    </>
  );
}

export default function ProgressFixture() {
  const [state, setState] = useState<Amount>('advance');
  const [delay, setDelay] = useState(150);
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(true);
  const [showValue, setShowValue] = useState(true);
  const [spinnerKey, setSpinnerKey] = useState(0);
  const [showSpinner, setShowSpinner] = useState(true);
  const [hideSpinner, setHideSpinner] = useState(false);
  const value = amounts.find(([name]) => name === state)?.[1] ?? null;
  const max = state === 'transfer' ? 80 : 100;
  const ignored = { contentEditable: true, tabIndex: 0, autoFocus: true } as Record<
    string,
    unknown
  >;

  return (
    <>
      <form data-testid="form">
        <button type="submit" name="intent" value="submit">
          Before indicators
        </button>
        <div data-testid="examples" style={{ maxInlineSize: 360, paddingBlock: '20px' }}>
          {showSpinner && (
            <Spinner
              key={spinnerKey}
              delay={delay}
              hidden={hideSpinner}
              aria-label="Checking archive"
              data-testid="spinner"
              size="m"
              tone="muted"
              {...ignored}
            />
          )}
          <ProgressCircle
            value={value}
            max={max}
            aria-label="Compact transfer"
            aria-valuetext="Archive units"
            tone="accent"
            size="m"
            data-testid="circle"
            {...ignored}
          />
          <Progress
            data-testid="linear"
            value={value}
            max={max}
            label="Archive transfer"
            active={active}
            paused={paused}
            showValue={showValue}
            aria-valuetext="Archive units"
            {...ignored}
          />
          <Progress
            data-testid="units"
            dir="rtl"
            label="التحقق من أرشيف المستندات والملفات المرجعية"
            value={value}
            max={max}
            valueLabel="42 of 80 MB — نسخة الأرشيف الأسبوعية"
            showValue={showValue}
          />
          <Progress
            value={100}
            aria-label="Finished transfer"
            data-testid="initial-full"
            showValue={false}
          />
          <Progress
            value={value}
            aria-label="Compact linear transfer"
            data-testid="track-only"
            showValue={false}
            size="s"
          />
        </div>
        <button type="reset">After indicators</button>
      </form>
      <label>
        Measurement
        <select
          value={state}
          onChange={(event) => {
            const amount = event.currentTarget.value as Amount;
            flushSync(() => setState(amount));
          }}
        >
          {amounts.map(([name]) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </label>
      <button type="button" onClick={() => setPaused(!paused)}>
        Toggle pause
      </button>
      <button type="button" onClick={() => setActive(!active)}>
        Toggle active
      </button>
      <button type="button" onClick={() => setShowValue(!showValue)}>
        Toggle units
      </button>
      <button type="button" onClick={() => setDelay(200)}>
        Threshold 200ms
      </button>
      <button
        type="button"
        onClick={() => {
          setSpinnerKey(spinnerKey + 1);
          setDelay(300);
        }}
      >
        New operation, 300ms
      </button>
      <button type="button" onClick={() => setDelay(300)}>
        Threshold 300ms
      </button>
      <button type="button" onClick={() => setDelay(50)}>
        Threshold 50ms
      </button>
      <button type="button" onClick={() => setShowSpinner(!showSpinner)}>
        Toggle spinner
      </button>
      <button type="button" onClick={() => setHideSpinner(!hideSpinner)}>
        Toggle spinner visibility
      </button>
      <div aria-hidden="true">
        {THEME_PRESETS.map(({ id }) => (
          <section key={id} data-testid={id}>
            <div data-theme={id} data-surface="base">
              <Progress value={null} aria-label="Base waiting" showValue={false} />
              <div data-surface="overlay">
                <Progress value={null} aria-label="Nested overlay waiting" showValue={false} />
              </div>
            </div>
            <div data-theme={id} data-surface="overlay">
              <Progress value={null} aria-label="Overlay waiting" showValue={false} />
            </div>
          </section>
        ))}
      </div>
      <div data-testid="hydrate-target" />
      <button
        type="button"
        onClick={() => {
          const target = document.querySelector('[data-testid="hydrate-target"]');
          if (target) {
            hydrateRoot(target, <ProgressHydration />);
          }
        }}
      >
        Hydrate indicators
      </button>
    </>
  );
}
