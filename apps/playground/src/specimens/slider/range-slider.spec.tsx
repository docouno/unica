import { RangeSlider } from '@docouno/unica';
import type { RangeSliderValue } from '@docouno/unica';
import { useId, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { defineComponent } from '../../workbench/types.js';
import {
  demoPresentation,
  demoScale,
  sliderConstraints,
  sliderControls,
} from './slider.controls.js';
import { sliderCases } from './slider.cases.js';

const initial: RangeSliderValue = [25, 75];
const labels = ['Minimum price', 'Maximum price'] as const;

function ControlledRange(): ReactElement {
  const id = useId();
  const [value, setValue] = useState<RangeSliderValue>(initial);
  const [accept, setAccept] = useState(true);
  const [proposal, reportProposal] = useState<RangeSliderValue>();
  const [committed, reportCommit] = useState<RangeSliderValue>();
  return (
    <div className="slider-examples">
      <label>
        <input
          type="checkbox"
          checked={accept}
          onChange={(event) => setAccept(event.currentTarget.checked)}
        />
        Accept edits
      </label>
      <div>
        <span id={id}>Price range</span>
        <RangeSlider
          aria-labelledby={id}
          thumbLabels={labels}
          value={value}
          onValueChange={(next) => {
            reportProposal(next);
            if (accept) {
              setValue(next);
            }
          }}
          onValueCommit={reportCommit}
        />
        <div>
          Proposed <bdi>{proposal?.join(' — ') ?? 'None'}</bdi>
        </div>
        <div>
          Last committed <bdi>{committed?.join(' — ') ?? 'None'}</bdi>
        </div>
      </div>
    </div>
  );
}

function NamedForm(): ReactElement {
  const heading = useId();
  const info = useId();
  const form = useId();
  const minimum = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState('');
  return (
    <div className="slider-examples">
      <form
        id={form}
        onSubmit={(event) => {
          event.preventDefault();
          const entries = new FormData(event.currentTarget);
          const from = entries.get('from');
          const to = entries.get('to');
          if (typeof from === 'string' && typeof to === 'string') {
            setResult(`${from} — ${to}`);
          }
        }}
      >
        <div className="slider-form-actions">
          <button type="submit">Read form data</button>
          <button type="reset" onClick={() => setResult('')}>
            Reset
          </button>
          <button type="button" onClick={() => minimum.current?.focus()}>
            Focus minimum price
          </button>
        </div>
      </form>
      <div>
        <span id={heading}>Price range</span>
        <RangeSlider
          aria-labelledby={heading}
          aria-describedby={info}
          thumbLabels={labels}
          names={['from', 'to']}
          inputRefs={[minimum, null]}
          form={form}
          defaultValue={initial}
          formatValue={(price) => `$${price}`}
        />
        <p id={info}>Both prices are inclusive.</p>
        {result && (
          <p>
            Submitted <bdi>{result}</bdi>
          </p>
        )}
      </div>
    </div>
  );
}

export default defineComponent({
  id: 'range-slider',
  title: 'RangeSlider',
  category: 'Forms',
  status: 'UI',
  componentName: 'RangeSlider',
  summary: 'Pick lower and upper bounds on one scale. Each thumb keeps its own name and tab stop.',
  form: 'owned',
  props: {
    ...sliderControls,
    formatValue: { ...sliderControls.formatValue, default: 'number' },
    defaultValue: {
      kind: 'slot',
      group: 'Scale',
      default: 'interval',
      description: 'Initial and reset values in lower, upper order.',
      choices: [
        { value: 'interval', label: '25 — 75', code: '[25, 75]' },
        { value: 'point', label: '50 — 50', code: '[50, 50]' },
        { value: 'full', label: 'Full span', code: 'undefined' },
      ],
    },
    value: {
      kind: 'slot',
      group: 'Scale',
      default: 'uncontrolled',
      description: 'An owner can supply both values and decide whether to accept edits.',
      choices: [
        { value: 'uncontrolled', code: 'undefined' },
        { value: 'fixed', label: 'Owner holds 25 — 75', code: '[25, 75]' },
      ],
    },
    minStepsBetweenThumbs: {
      kind: 'number',
      group: 'Scale',
      default: 0,
      examples: [0, 1, 5],
      description: 'Minimum separation in steps. Zero allows a shared point.',
    },
    names: {
      kind: 'slot',
      group: 'Form',
      default: 'named',
      description: 'Submission names in lower, upper order.',
      choices: [
        { value: 'named', label: 'from, to', code: "['from', 'to']" },
        { value: 'none', code: 'undefined' },
      ],
    },
    thumbLabels: {
      kind: 'slot',
      group: 'Semantics',
      default: 'prices',
      description: 'Distinct accessible names for the lower and upper thumb.',
      choices: [
        {
          value: 'prices',
          label: 'Minimum price, Maximum price',
          code: "['Minimum price', 'Maximum price']",
        },
        {
          value: 'bounds',
          label: 'Lower bound, Upper bound',
          code: "['Lower bound', 'Upper bound']",
        },
      ],
    },
  },
  constraints: [
    ...sliderConstraints,
    {
      kind: 'precedence',
      when: { value: 'fixed' },
      affects: ['defaultValue'],
      reason:
        'The owner holds both values. Change reports proposals and a refused change produces no commit.',
    },
  ],
  render: ({ values, ctx }) => {
    const { defaultValue, value, form, names, thumbLabels, minStepsBetweenThumbs, ...props } =
      values;
    if (
      !demoScale(props.min, props.max, props.step) ||
      !Number.isSafeInteger(minStepsBetweenThumbs) ||
      minStepsBetweenThumbs < 0 ||
      minStepsBetweenThumbs > Math.floor((props.max - props.min) / props.step)
    ) {
      return (
        <p>
          Use whole numbers, ordered bounds, a positive step, and a gap between zero and the number
          of steps.
        </p>
      );
    }
    const heading = `${ctx.id}-heading`;
    const formId = form ? `${ctx.id}-${form}` : undefined;
    return (
      <form {...ctx.form} className="slider-inspector-form" id={formId}>
        <span id={heading}>Price range</span>
        <RangeSlider
          {...props}
          {...demoPresentation(props)}
          {...ctx.subject}
          id={ctx.id}
          aria-labelledby={heading}
          form={formId}
          thumbLabels={thumbLabels === 'prices' ? labels : ['Lower bound', 'Upper bound']}
          names={names === 'named' ? ['from', 'to'] : undefined}
          key={`${value}:${defaultValue}`}
          value={value === 'fixed' ? initial : undefined}
          defaultValue={
            defaultValue === 'interval' ? initial : defaultValue === 'point' ? [50, 50] : undefined
          }
          minStepsBetweenThumbs={minStepsBetweenThumbs}
          onValueChange={ctx.action('onValueChange')}
          onValueCommit={ctx.action('onValueCommit')}
        />
        <button type="reset">Reset</button>
      </form>
    );
  },
  code: (values, attributes) => {
    const names = values.names === 'named' ? ' names={["from", "to"]}' : '';
    const labels =
      values.thumbLabels === 'prices' ? ' thumbLabels={["Minimum price", "Maximum price"]}' : '';
    const initial = values.defaultValue === 'interval' ? ' defaultValue={[25, 75]}' : '';
    const jsx = `<span id="price-label">Price range</span>\n<RangeSlider aria-labelledby="price-label"${labels}${names}${initial}${attributes} />`;
    return jsx.replace(
      'marks={endpoints}',
      `marks={${JSON.stringify(demoPresentation(values).marks)}}`,
    );
  },
  matrixViews: [
    { id: 'geometry', title: 'Size and direction', rows: 'size', cols: 'orientation' },
    {
      id: 'surface',
      title: 'Validation on a floating surface',
      rows: 'status',
      cols: 'disabled',
      surface: 'overlay',
    },
  ],
  cases: [
    ...sliderCases.filter((example) =>
      ['range', 'availability', 'close-bounds', 'vertical', 'content', 'overlay'].includes(
        example.id,
      ),
    ),
    {
      id: 'controlled',
      title: 'Owner accepts or refuses edits',
      kind: 'behavior',
      caption:
        'Move either thumb with acceptance on and off. Compare what the control proposed with what it committed.',
      render: ControlledRange,
    },
  ],
  usage: [
    {
      id: 'form',
      title: 'Two named fields and native reset',
      caption: 'The range can live outside its form. Form data contains the two original numbers.',
      code: `const minimum = useRef<HTMLInputElement>(null);

<form id="filters">
  <button type="reset">Reset</button>
  <button type="button" onClick={() => minimum.current?.focus()}>Focus minimum price</button>
</form>
<RangeSlider
  aria-label="Price range"
  thumbLabels={['Minimum price', 'Maximum price']}
  names={['from', 'to']}
  form="filters"
  inputRefs={[minimum, null]}
  defaultValue={[25, 75]}
/>`,
      render: NamedForm,
    },
  ],
});
