import { Stepper, StepperStep } from '@docouno/unica';
import type {
  StepperLayout,
  StepperMessages,
  StepperSize,
  StepperStepStatus,
} from '@docouno/unica';
import { useLayoutEffect, useRef, useState } from 'react';
import type { JSX } from 'react';
import { flushSync } from 'react-dom';

const order = ['A', 'B', 'C', 'D'] as const;
type Stage = (typeof order)[number] | 'E' | 'F' | 'G' | 'H' | 'I';

interface Options {
  readonly value: Stage | null;
  readonly controlled: boolean;
  readonly allowReturn: boolean;
  readonly layout: StepperLayout;
  readonly size: StepperSize;
  readonly accept: 'no' | 'yes' | 'redirect';
  readonly order: readonly Stage[];
  readonly disabled: boolean;
  readonly legend: boolean;
  readonly width: number;
  readonly longText: boolean;
  readonly localized: boolean;
  readonly direction: 'ltr' | 'rtl';
  readonly oppositeCopy: boolean;
  readonly firstStatus: StepperStepStatus;
  readonly firstLabel: string | null;
}

declare global {
  interface Window {
    readonly stepperProbe?: { readonly update: (patch: Partial<Options>) => void };
  }
}

const arMessages: StepperMessages = {
  allSteps: 'عرض المراحل',
  allComplete: 'اكتملت المراحل',
  markerNumber: (index) => new Intl.NumberFormat('ar-EG').format(index),
  position: (index, total) => `المجموع ${total} · الحالية ${index}`,
  completedCount: (count, total) => `من ${total} اكتمل ${count}`,
  stepLabel: (index, label, completed) => `${label} · ${index}${completed ? ' · مكتمل' : ''}`,
  needsAttention: (message) => (message ? `تنبيه · ${message}` : 'تتطلب مراجعة'),
  checkStep: (label) => `راجع ${label}`,
};

const authored = {
  A: 'Source',
  B: 'Verify',
  C: 'Commit',
  D: 'Publish',
  E: 'Notify',
  F: 'Archive',
  G: 'Close',
  H: 'Approve',
  I: 'Send',
};

export default function StepperFixture(): JSX.Element {
  const [options, setOptions] = useState<Options>({
    value: 'B',
    controlled: true,
    allowReturn: true,
    layout: 'responsive',
    size: 'm',
    accept: 'no',
    order,
    disabled: false,
    legend: false,
    width: 650,
    longText: false,
    localized: true,
    direction: 'ltr',
    oppositeCopy: false,
    firstStatus: 'neutral',
    firstLabel: null,
  });
  const [requests, setRequests] = useState<string[]>([]);
  const [submissions, setSubmissions] = useState(0);
  const outside = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    Object.defineProperty(window, 'stepperProbe', {
      configurable: true,
      value: {
        update: (patch: Partial<Options>) =>
          flushSync(() => setOptions((old) => ({ ...old, ...patch }))),
      },
    });
    return () => {
      Reflect.deleteProperty(window, 'stepperProbe');
    };
  }, []);

  function onValueChange(next: string): void {
    setRequests((old) => [...old, next]);
    if (options.accept !== 'no') {
      setOptions((old) => ({ ...old, value: next as Stage }));
    }
    if (options.accept === 'redirect') {
      outside.current?.focus();
    }
  }

  const map = (
    <div data-testid="map-container" style={{ inlineSize: options.width, maxInlineSize: '100%' }}>
      <Stepper
        aria-label="Import stages"
        lang={options.localized ? 'ar' : undefined}
        dir={options.direction}
        allowReturn={options.allowReturn}
        value={options.controlled ? options.value : undefined}
        defaultValue={options.value}
        onValueChange={onValueChange}
        layout={options.layout}
        size={options.size}
        messages={options.localized ? arMessages : undefined}
      >
        {options.order.map((stage) => {
          const ownDirection = options.oppositeCopy && (stage === 'B' || stage === 'C');
          const label =
            stage === 'B' && options.longText
              ? 'VerifyRepositoryLinksAndCrossReferencesBeforePublishing'
              : (stage === 'A' && options.firstLabel) || authored[stage];
          return (
            <StepperStep
              key={stage}
              value={stage}
              id={stage}
              label={label}
              lang={ownDirection ? (options.direction === 'ltr' ? 'ar' : 'en') : undefined}
              dir={ownDirection ? (options.direction === 'ltr' ? 'rtl' : 'ltr') : undefined}
              completed={stage === 'A' || stage === 'C'}
              status={stage === 'C' ? 'danger' : stage === 'A' ? options.firstStatus : 'neutral'}
              description={stage === 'B' ? 'Cross-check links and owner mappings.' : undefined}
              message={stage === 'C' ? 'Choose a destination.' : undefined}
            />
          );
        })}
      </Stepper>
    </div>
  );

  return (
    <form
      data-testid="stepper-form"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmissions((old) => old + 1);
      }}
    >
      <input aria-label="Before" name="title" defaultValue="Original" required />
      <fieldset disabled={options.disabled} style={{ minInlineSize: 0, padding: 6 }}>
        {options.legend ? <legend>{map}</legend> : map}
      </fieldset>
      <button type="button" ref={outside}>
        After
      </button>
      <button type="button" onClick={() => setOptions((old) => ({ ...old, value: 'D' }))}>
        External next
      </button>
      <button type="submit">Save</button>
      <output data-testid="requests">{requests.join(',')}</output>
      <output data-testid="submissions">{submissions}</output>
      <Stepper aria-label="Another process" allowReturn defaultValue="second" layout="vertical">
        <StepperStep value="first" label="Other first" completed />
        <StepperStep value="second" label="Other second" />
      </Stepper>
    </form>
  );
}
