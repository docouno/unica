import { Slider } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import {
  demoPresentation,
  demoScale,
  sliderConstraints,
  sliderControls,
} from './slider.controls.js';
import { sliderCases, sliderMatrix, sliderUsage } from './slider.cases.js';

export default defineComponent({
  id: 'slider',
  title: 'Slider',
  category: 'Forms',
  status: 'UI',
  componentName: 'Slider',
  summary: 'Pick one value on a stepped scale with a pointer, keyboard, or native assistive input.',
  form: 'owned',
  props: {
    ...sliderControls,
    defaultValue: {
      kind: 'number',
      group: 'Scale',
      default: 65,
      examples: [0, 65, 100],
      description:
        'Initial value and native reset baseline. The scale projects it onto a reachable step.',
    },
    value: {
      kind: 'slot',
      group: 'Scale',
      default: 'uncontrolled',
      description: 'An owner can supply the value and decide whether to accept proposed changes.',
      choices: [
        { value: 'uncontrolled', code: 'undefined' },
        { value: 'fixed', label: 'Owner holds 65', code: '65' },
      ],
    },
    name: {
      kind: 'string',
      group: 'Form',
      default: 'quality',
      description: 'Name used in form submission.',
    },
  },
  constraints: [
    ...sliderConstraints,
    {
      kind: 'precedence',
      when: { value: 'fixed' },
      affects: ['defaultValue'],
      reason:
        'The owner holds the value. Change still reports proposals and a refused change produces no commit.',
    },
  ],
  render: ({ values, ctx }) => {
    const { value, defaultValue, form, ...props } = values;
    if (!demoScale(props.min, props.max, props.step) || !Number.isFinite(defaultValue)) {
      return (
        <p>
          Use whole numbers from −10,000 to 10,000 for the scale, ordered bounds, and a positive
          step.
        </p>
      );
    }
    const formId = form ? `${ctx.id}-${form}` : undefined;
    return (
      <form {...ctx.form} className="slider-inspector-form" id={formId}>
        <label htmlFor={ctx.id}>Image quality</label>
        <Slider
          {...props}
          {...demoPresentation(props)}
          {...ctx.subject}
          id={ctx.id}
          form={formId}
          key={`${value}:${defaultValue}`}
          value={value === 'fixed' ? 65 : undefined}
          defaultValue={defaultValue}
          onValueChange={ctx.action('onValueChange')}
          onValueCommit={ctx.action('onValueCommit')}
        />
        <button type="reset">Reset</button>
      </form>
    );
  },
  code: (values, attributes) => {
    const name = values.name === 'quality' ? ' name="quality"' : '';
    const initial = values.defaultValue === 65 ? ' defaultValue={65}' : '';
    const format = values.formatValue === 'percent' ? ' formatValue={(value) => value + "%"}' : '';
    const jsx = `<label htmlFor="quality">Image quality</label>\n<Slider id="quality"${name}${initial}${format}${attributes} />`;
    return jsx.replace(
      'marks={endpoints}',
      `marks={${JSON.stringify(demoPresentation(values).marks)}}`,
    );
  },
  matrixViews: sliderMatrix,
  cases: sliderCases,
  usage: sliderUsage,
});
