import { RangeSlider, Slider } from '@docouno/unica';
import type { RangeSliderValue } from '@docouno/unica';
import { startTransition, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { flushSync } from 'react-dom';

type Reaction =
  'accept' | 'refuse' | 'nested' | 'replace' | 'later' | 'transition' | 'partial' | 'blur';

export default function SliderFixture(): ReactElement {
  const formA = useRef<HTMLFormElement>(null);
  const formB = useRef<HTMLFormElement>(null);
  const scalarRef = useRef<HTMLInputElement>(null);
  const group = useRef<HTMLDivElement>(null);
  const lowerRef = useRef<HTMLInputElement>(null);
  const upperRef = useRef<HTMLInputElement>(null);
  const resetOnNextCommit = useRef(false);
  const [rhs, setRhs] = useState(false);
  const [mode, setMode] = useState<Reaction>('accept');
  const [entries, setEntries] = useState<unknown[]>([]);
  const [number, setNumber] = useState(20);
  const [scalarCommit, setScalarCommit] = useState(true);
  const [axis, setAxis] = useState<'horizontal' | 'vertical'>('horizontal');
  const [readOnly, setReadOnly] = useState(false);
  const [disabled, setDisabled] = useState(false);
  const [locked, setLocked] = useState(true);
  const [max, setMax] = useState(100);
  const [rangeMax, setRangeMax] = useState(100);
  const [rangeStep, setRangeStep] = useState(1);
  const [resetOnEdit, setResetOnEdit] = useState(false);
  const [resetOnFocus, setResetOnFocus] = useState(false);
  const [coarseOnCommit, setCoarseOnCommit] = useState(false);
  const [collapse, setCollapse] = useState(false);
  const [narrow, setNarrow] = useState(false);
  const [zoom, setZoom] = useState(false);
  const [touched, setTouched] = useState(false);

  function record(
    kind: string,
    value: number | RangeSliderValue,
    owner: HTMLFormElement | null,
  ): void {
    const snapshot = owner ? [...new FormData(owner)] : [];
    setEntries((current) => [...current, { kind, value, snapshot }]);
  }

  function onScalarChange(next: number): void {
    record('change', next, formA.current);
    switch (mode) {
      case 'refuse':
        return;
      case 'partial':
        if (next === 22) {
          return;
        }
        break;
      case 'replace':
        setNumber(49);
        return;
      case 'nested':
        flushSync(() => setTouched(true));
        break;
      case 'later':
        Promise.resolve(next)
          .then(setNumber)
          .catch((error: unknown) => window.reportError(error));
        return;
      case 'transition':
        startTransition(() => setNumber(next));
        return;
      case 'accept':
        break;
      case 'blur':
        formA.current?.querySelector<HTMLButtonElement>('button[type=reset]')?.focus();
        break;
    }
    setNumber(next);
  }

  return (
    <>
      <form ref={formA} id="first-form">
        <label htmlFor="scalar">Exposure</label>
        <div style={{ width: 320, zoom: zoom ? 0.5 : 1 }}>
          <Slider
            data-testid="scalar"
            id="scalar"
            ref={scalarRef}
            name="exposure"
            value={number}
            max={max}
            readOnly={readOnly}
            disabled={disabled}
            orientation={axis}
            status="danger"
            formatValue={(value) => `${value}%`}
            onValueChange={onScalarChange}
            onValueCommit={
              scalarCommit ? (value) => record('commit', value, formA.current) : undefined
            }
          />
        </div>
        <button type="reset">Reset first</button>
      </form>
      <form
        ref={formB}
        id="second-form"
        onReset={(event) => {
          if (event.currentTarget.dataset.adopt === 'true') {
            flushSync(() => setRhs(true));
            event.nativeEvent.stopImmediatePropagation();
          }
        }}
      >
        <button type="reset">Reset second</button>
      </form>
      <fieldset disabled={disabled}>
        <legend>
          <Slider aria-label="Legend control" name="legend" form="first-form" />
        </legend>
        <div style={{ width: narrow ? 140 : 320, zoom: zoom ? 0.5 : 1 }}>
          <p id="range-name">Price window</p>
          <p id="range-help">Both ends are inclusive</p>
          <p id="low-help">Minimum price only</p>
          <RangeSlider
            key={String(collapse)}
            data-testid="range"
            ref={group}
            inputRefs={[lowerRef, upperRef]}
            inputProps={[{ 'aria-describedby': 'low-help range-help' }, {}]}
            aria-labelledby="range-name"
            aria-describedby="range-help"
            thumbLabels={['Minimum price', 'Maximum price']}
            names={['price', 'price']}
            form={rhs ? 'second-form' : 'first-form'}
            defaultValue={collapse ? [50, 50] : [60, 80]}
            max={rangeMax}
            step={rangeStep}
            orientation={axis}
            readOnly={readOnly}
            status="danger"
            marks={
              rangeMax >= 100
                ? [
                    { value: 0, label: 'An exceptionally long starting label for this scale' },
                    { value: 25, label: '25' },
                    { value: 50, label: '50' },
                    { value: 75, label: '75' },
                    { value: 100, label: 'Another exceptionally long label at the other end' },
                  ]
                : undefined
            }
            onFocus={(event) => {
              if (resetOnFocus && event.target === lowerRef.current) {
                lowerRef.current?.form?.reset();
              }
            }}
            onValueChange={(value) => {
              const owner = lowerRef.current?.form ?? null;
              record('range change', value, owner);
              if (resetOnEdit) {
                owner?.reset();
              }
            }}
            onValueCommit={(value) => {
              record('range commit', value, lowerRef.current?.form ?? null);
              if (coarseOnCommit) {
                flushSync(() => setRangeStep(10));
              }
              if (resetOnNextCommit.current) {
                resetOnNextCommit.current = false;
                lowerRef.current?.form?.reset();
              }
            }}
          />
        </div>
      </fieldset>
      <label>
        Controlled owner
        <select value={mode} onChange={(event) => setMode(event.currentTarget.value as Reaction)}>
          {(
            [
              'accept',
              'refuse',
              'nested',
              'replace',
              'later',
              'transition',
              'partial',
              'blur',
            ] as const
          ).map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </label>
      <button onClick={() => setNumber(20)}>Set 20</button>
      <button onClick={() => setScalarCommit(false)}>Omit scalar commit callback</button>
      <button
        onClick={() => setAxis((value) => (value === 'horizontal' ? 'vertical' : 'horizontal'))}
      >
        Toggle axis
      </button>
      <button onClick={() => setReadOnly((value) => !value)}>Toggle readonly</button>
      <button onClick={() => setDisabled((value) => !value)}>Toggle disabled</button>
      <button onClick={() => setMax((value) => (value === 100 ? 50 : 100))}>
        Toggle scalar bound
      </button>
      <button id="owner" onClick={() => flushSync(() => setRhs((value) => !value))}>
        Toggle range form
      </button>
      <button
        id="range-bound"
        onClick={() => flushSync(() => setRangeMax((value) => (value === 100 ? 30 : 100)))}
      >
        Toggle range bound
      </button>
      <button onClick={() => setResetOnEdit((value) => !value)}>
        Reset during each range edit
      </button>
      <button onClick={() => setResetOnFocus((value) => !value)}>
        Reset when lower thumb gets focus
      </button>
      <button
        onClick={() => {
          resetOnNextCommit.current = true;
        }}
      >
        Reset after the next range commit
      </button>
      <button onClick={() => setCoarseOnCommit((value) => !value)}>
        Use coarse step after a commit
      </button>
      <button onClick={() => setCollapse((value) => !value)}>Toggle collapsed range</button>
      <button onClick={() => setNarrow((value) => !value)}>Toggle narrow</button>
      <button onClick={() => setZoom((value) => !value)}>Toggle zoom</button>
      <button onClick={() => setEntries([])}>Clear log</button>
      <button onClick={() => scalarRef.current?.focus()}>Focus scalar ref</button>
      <button
        onClick={() => {
          group.current?.setAttribute('data-group-ref', '');
          upperRef.current?.focus();
        }}
      >
        Focus upper ref
      </button>
      <div data-testid="log" data-touched={touched}>
        {JSON.stringify(entries)}
      </div>
      <Slider aria-label="Initially disabled value" status="danger" readOnly disabled={locked} />
      <RangeSlider
        aria-label="Initially disabled bounds"
        thumbLabels={['Initially disabled lower', 'Initially disabled upper']}
        status="danger"
        readOnly
        disabled={locked}
      />
      <button onClick={() => setLocked(false)}>Enable standalone sliders</button>
    </>
  );
}
