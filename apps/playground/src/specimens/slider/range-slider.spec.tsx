import { RangeSlider, Stack, Text } from '@docouno/unica';
import type { RangeSliderValue } from '@docouno/unica';
import { defineComponent } from '../../workbench/types.js';
import { eventProp } from '../control-props.js';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import {
  demoPresentation,
  demoScale,
  sliderConstraints,
  sliderPresentationCode,
  rejectedScaleCode,
  sliderControls,
} from './slider.controls.js';
import {
  AvailabilityExample,
  CloseBoundsExample,
  ContentExample,
  ControlledRange,
  OverlayExample,
  RangeExample,
  VerticalExample,
} from './slider.examples.js';
import { PriceFilter } from './range-price-form.js';
import formSource from './range-price-form.tsx?raw';

const initial: RangeSliderValue = [25, 75];
const labels = ['Minimum price', 'Maximum price'] as const;

const scaleMessage =
  'Use whole-number bounds from −10,000 to 10,000, with the minimum at or below the maximum and a positive whole-number step up to 10,000.';
const gapMessage = 'Use a whole-number gap from zero to the number of reachable steps.';
const approval = 'This price interval needs review.';

function rangeIssue({
  min,
  max,
  step,
  minStepsBetweenThumbs: gap,
}: {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly minStepsBetweenThumbs: number;
}): string | undefined {
  if (!demoScale(min, max, step)) {
    return scaleMessage;
  }
  if (!Number.isSafeInteger(gap) || gap < 0 || gap > Math.floor((max - min) / step)) {
    return gapMessage;
  }
  return undefined;
}

function initialRange(preset: string): RangeSliderValue | undefined {
  if (preset === 'interval') {
    return initial;
  }
  if (preset === 'point') {
    return [50, 50];
  }
  return undefined;
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
    onValueChange: eventProp(
      'Receives each proposed lower and upper bound in a fresh tuple.',
      '(next) => console.log(next)',
      '(next: readonly [number, number]) => void',
    ),
    onValueCommit: eventProp(
      'Receives the accepted interval at the end of a changed gesture.',
      '(next) => console.log(next)',
      '(next: readonly [number, number]) => void',
    ),
    defaultValue: {
      kind: 'slot',
      group: 'Content',
      default: 'interval',
      publicType: 'readonly [number, number]',
      description:
        'Initial and reset values in lower, upper order. Omit the tuple to span the reachable scale.',
      choices: [
        { value: 'interval', label: '25 — 75', code: '[25, 75]' },
        { value: 'point', label: '50 — 50', code: '[50, 50]' },
        { value: 'full', label: 'Full span', code: 'undefined' },
      ],
    },
    value: {
      kind: 'slot',
      group: 'Content',
      default: 'uncontrolled',
      publicType: 'readonly [number, number]',
      description: 'An owner can supply both values and decide whether to accept edits.',
      choices: [
        { value: 'uncontrolled', code: 'undefined' },
        { value: 'fixed', label: 'Owner holds 25 — 75', code: '[25, 75]' },
      ],
    },
    minStepsBetweenThumbs: {
      kind: 'number',
      group: 'Geometry',
      default: 0,
      examples: [0, 1, 5],
      description: 'Minimum separation in steps. Zero allows a shared point.',
    },
    names: {
      kind: 'slot',
      group: 'Host',
      default: 'named',
      publicType: 'readonly [string, string]',
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
      publicType: 'readonly [string, string]',
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
  render: withOverlaySurface(({ values, ctx }) => {
    const issue = rangeIssue(values);
    if (issue) {
      return (
        <form {...ctx.form} className="slider-inspector-form">
          <Text size="body-s" role="status">
            <bdi>{issue}</bdi>
          </Text>
        </form>
      );
    }
    const { defaultValue, value, form, names, thumbLabels, ...props } = values;
    const formId = form ? ctx.id + '-' + form : undefined;
    const review = props.status === 'danger' && !props.disabled;
    const title =
      props.formatValue === 'percent' ? 'Price as a percentage of list price' : 'Price range';
    return (
      <form {...ctx.form} className="slider-inspector-form" id={formId}>
        <Stack gap={4}>
          <Text as="span" size="body-s" id={ctx.id + '-label'}>
            <bdi>{title}</bdi>
          </Text>
          <RangeSlider
            {...props}
            {...demoPresentation(props)}
            {...ctx.subject}
            aria-labelledby={ctx.id + '-label'}
            aria-describedby={review ? ctx.id + '-review' : undefined}
            form={formId}
            thumbLabels={thumbLabels === 'prices' ? labels : ['Lower bound', 'Upper bound']}
            names={names === 'named' ? ['from', 'to'] : undefined}
            key={value + ':' + defaultValue}
            value={value === 'fixed' ? initial : undefined}
            defaultValue={value === 'fixed' ? undefined : initialRange(defaultValue)}
            onValueChange={ctx.action('onValueChange')}
            onValueCommit={ctx.action('onValueCommit')}
          />
          {review && (
            <Text as="p" size="caption-l" color="danger" id={ctx.id + '-review'}>
              <bdi>{approval}</bdi>
            </Text>
          )}
        </Stack>
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const issue = rangeIssue(values);
    if (issue) {
      return rejectedScaleCode(issue);
    }
    const title =
      values.formatValue === 'percent' ? 'Price as a percentage of list price' : 'Price range';
    const review = values.status === 'danger' && !values.disabled;
    const names = values.names === 'named' ? ' names={["from", "to"]}' : '';
    const thumbLabels = values.thumbLabels === 'prices' ? labels : ['Lower bound', 'Upper bound'];
    const baseline = initialRange(values.defaultValue);
    const value =
      values.value === 'fixed'
        ? ' value={[25, 75]}'
        : baseline
          ? ' defaultValue={' + JSON.stringify(baseline) + '}'
          : '';
    const gap = values.minStepsBetweenThumbs
      ? ' minStepsBetweenThumbs={' + values.minStepsBetweenThumbs + '}'
      : '';
    return `import { useId } from 'react';
import { RangeSlider, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function PriceRange() {
  const id = useId();${values.form ? '\n  const owner = id + ' + JSON.stringify('-' + values.form) + ';' : ''}
  return (
    <form${values.form ? ' id={owner}' : ''}>
      <Stack gap={4}>
        <Text as="span" size="body-s" id={id + "-label"}><bdi>${title}</bdi></Text>
        <RangeSlider aria-labelledby={id + "-label"}${review ? ' aria-describedby={id + "-review"}' : ''}${values.form ? ' form={owner}' : ''} thumbLabels={${JSON.stringify(thumbLabels)}}${names}${value}${gap}${sliderPresentationCode(values)} onValueChange={(next) => console.log(next)} onValueCommit={(next) => console.log(next)} />
        ${review ? '<Text as="p" id={id + "-review"} size="caption-l" color="danger"><bdi>' + approval + '</bdi></Text>' : ''}
      </Stack>
    </form>
  );
}`;
  },
  states: [
    {
      id: 'geometry',
      title: 'Size and direction',
      rows: 'size',
      cols: 'orientation',
      caption:
        'Compare the two focusable thumbs at every size. A vertical scale increases toward the top.',
    },
    {
      id: 'surface',
      title: 'Validation on a floating surface',
      rows: 'status',
      cols: 'disabled',
      surface: 'overlay',
      caption:
        'The enabled interval can show a review message. A disabled interval keeps its current prices and is omitted from submission.',
    },
  ],
  cases: [
    {
      id: 'range',
      title: 'Two bounds on one scale',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Adjust the lower and upper bounds of three intervals. Each thumb stops at the other bound without pushing it.',
      render: withOverlaySurface(
        ({ ctx }) => <RangeExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'availability',
      title: 'Availability and validation',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Read-only values remain focusable. Disabled fields stay neutral. Include 50 in the allowed window to clear its error.',
      render: withOverlaySurface(
        ({ ctx }) => <AvailabilityExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'close-bounds',
      title: 'Close and coincident bounds',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Compare close thumbs with both thumbs at the middle or either endpoint. The final interval keeps a two-step gap.',
      render: withOverlaySurface(
        ({ ctx }) => <CloseBoundsExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'vertical',
      title: 'Vertical scales',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'The minimum stays at the bottom in either reading direction. The percentage readouts share a unit across the numeric ticks. Coincident thumbs remain separate tab stops.',
      render: withOverlaySurface(
        ({ ctx }) => <VerticalExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'content',
      title: 'Long labels and formatted amounts',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a width in pixels with the lower and upper amounts of an annual budget. Read the full formatted values as their labels wrap.',
      render: withOverlaySurface(
        ({ ctx }) => <ContentExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'overlay',
      title: 'Intervals on a floating surface',
      surface: 'overlay',
      overlayStage: true,
      kind: 'surface',
      mode: 'live',
      reset: true,
      caption:
        'The single scale and the interval share a compact floating panel. Track, selection, and focused thumb remain distinguishable.',
      render: ({ ctx }) => <OverlayExample rangeSubject={ctx.subject} />,
    },
    {
      id: 'controlled',
      title: 'Owner accepts or refuses edits',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      controls: { accept: { kind: 'boolean', label: 'Accept edits', default: true } },
      caption:
        'Move either thumb with acceptance on and off. A refused proposal leaves the interval and its last commit in place.',
      render: withOverlaySurface(ControlledRange, 'border-box'),
    },
  ],
  compositions: [
    {
      id: 'form',
      title: 'Two named fields and native reset',
      mode: 'live',
      reset: true,
      caption:
        'Both thumbs belong to the form below the interval. Apply a price filter to see the submitted bounds. Edit the applied range to return to its minimum.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="slider-study-width">
            <PriceFilter rangeProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: formSource,
    },
  ],
});
