import { Slider, Stack, Text } from '@docouno/unica';
import { withOverlaySurface } from '../shared/with-overlay-surface.js';
import { defineComponent } from '../../workbench/types.js';
import {
  demoPresentation,
  demoScale,
  sliderConstraints,
  sliderPresentationCode,
  rejectedScaleCode,
  scaleMessage,
  sliderControls,
} from './slider.controls.js';
import {
  SizesExample,
  RangeExample,
  InteractionExample,
  AvailabilityExample,
  BoundsExample,
  CloseBoundsExample,
  VerticalExample,
  ContentExample,
  OverlayExample,
} from './slider.examples.js';
import { ImageQuality } from './exact-quality.js';
import exactSource from './exact-quality.tsx?raw';

const reviewMessage = 'This export setting needs review.';

function sliderIssue({
  min,
  max,
  step,
  defaultValue,
  value,
}: {
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly defaultValue: number;
  readonly value: string;
}): string | undefined {
  if (!demoScale(min, max, step)) {
    return scaleMessage;
  }
  if (value !== 'fixed' && !Number.isFinite(defaultValue)) {
    return 'Use a finite initial value.';
  }
  return undefined;
}

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
      group: 'Content',
      default: 65,
      examples: [0, 65, 100],
      description:
        'Initial value and native reset baseline. This example starts at 65. Omitting the prop uses the midpoint of the reachable scale.',
    },
    value: {
      kind: 'slot',
      group: 'Content',
      default: 'uncontrolled',
      publicType: 'number',
      description: 'An owner can supply the value and decide whether to accept proposed changes.',
      choices: [
        { value: 'uncontrolled', code: 'undefined' },
        { value: 'fixed', label: 'Owner holds 65', code: '65' },
      ],
    },
    name: {
      kind: 'string',
      group: 'Host',
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
  render: withOverlaySurface(({ values, ctx }) => {
    const issue = sliderIssue(values);
    if (issue) {
      return (
        <form {...ctx.form} className="slider-inspector-form">
          <Text size="body-s" role="status">
            <bdi>{issue}</bdi>
          </Text>
        </form>
      );
    }
    const { value, defaultValue, form, ...props } = values;
    const formId = form ? ctx.id + '-' + form : undefined;
    const review = props.status === 'danger' && !props.disabled;
    const title = props.formatValue === 'percent' ? 'Image quality (%)' : 'Image quality';
    return (
      <form {...ctx.form} id={formId} className="slider-inspector-form">
        <Stack gap={4}>
          <Text as="label" htmlFor={ctx.id} size="body-s">
            <bdi>{title}</bdi>
          </Text>
          <Slider
            {...props}
            {...demoPresentation(props)}
            {...ctx.subject}
            id={ctx.id}
            form={formId}
            aria-describedby={review ? ctx.id + '-review' : undefined}
            key={value + ':' + defaultValue}
            value={value === 'fixed' ? 65 : undefined}
            defaultValue={value === 'fixed' ? undefined : defaultValue}
            onValueChange={ctx.action('onValueChange')}
            onValueCommit={ctx.action('onValueCommit')}
          />
          {review && (
            <Text size="caption-l" color="danger" id={ctx.id + '-review'}>
              <bdi>{reviewMessage}</bdi>
            </Text>
          )}
        </Stack>
      </form>
    );
  }, 'border-box'),
  code: (values) => {
    const issue = sliderIssue(values);
    if (issue) {
      return rejectedScaleCode(issue);
    }
    const review = values.status === 'danger' && !values.disabled;
    const title = values.formatValue === 'percent' ? 'Image quality (%)' : 'Image quality';
    const value =
      values.value === 'fixed' ? ' value={65}' : ' defaultValue={' + values.defaultValue + '}';
    return `import { useId } from 'react';
import { Slider, Stack, Text } from '@docouno/unica';
import '@docouno/unica/styles.css';

export function ExportQuality() {
  const id = useId();${values.form ? '\n  const owner = id + ' + JSON.stringify('-' + values.form) + ';' : ''}
  return (
    <form${values.form ? ' id={owner}' : ''}>
      <Stack gap={4}>
        <Text as="label" htmlFor={id} size="body-s"><bdi>${title}</bdi></Text>
        <Slider id={id} name={${JSON.stringify(values.name)}}${values.form ? ' form={owner}' : ''}${review ? ' aria-describedby={id + "-review"}' : ''}${value}${sliderPresentationCode(values)} onValueChange={(next) => console.log(next)} onValueCommit={(next) => console.log(next)} />
        ${review ? '<Text id={id + "-review"} size="caption-l" color="danger"><bdi>' + reviewMessage + '</bdi></Text>' : ''}
      </Stack>
    </form>
  );
}`;
  },
  states: [
    {
      id: 'sizes',
      title: 'Size and direction',
      rows: 'size',
      cols: 'orientation',
      caption:
        'Compare the rail, cap, and pointer target in each density and orientation. The vertical minimum stays at the bottom.',
    },
  ],
  cases: [
    {
      id: 'size-contexts',
      title: 'Percentages at three densities',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'The compact typography scale spans 80–140% in five-point steps. Image quality and playback volume use the full percentage scale.',
      render: withOverlaySurface(
        ({ ctx }) => <SizesExample sliderSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'range',
      title: 'Two-bound scales at three sizes',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'RangeSlider adds a second thumb for an interval. Compare it across context lines, prices, and brightness. Moving one bound keeps the other in place.',
      render: withOverlaySurface(
        ({ ctx }) => <RangeExample rangeSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'interaction',
      title: 'Pointer and keyboard editing',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Adjust image quality with one cap, then move the two independently focusable ends of a playback window. Escape cancels an active drag.',
      render: withOverlaySurface(
        ({ ctx }) => <InteractionExample sliderSubject={ctx.subject} />,
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
        'Read-only settings keep keyboard focus, while disabled settings skip it. Raise export quality to at least 40% or include 50 in the allowed window to clear its error.',
      render: withOverlaySurface(
        ({ ctx }) => <AvailabilityExample sliderSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'bounds',
      title: 'Endpoints, precision, and marks',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'Compare both endpoints, 0.05 line-spacing steps, and signed exposure values. Reference marks describe the scale independently of its step.',
      render: withOverlaySurface(
        ({ ctx }) => <BoundsExample sliderSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'close-bounds',
      title: 'Close and coincident interval bounds',
      kind: 'behavior',
      mode: 'live',
      reset: true,
      caption:
        'RangeSlider keeps both bounds accessible at the same point. Compare close values, shared endpoints, and the final two-step minimum separation.',
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
        'The single level and both intervals increase from bottom to top. The percentage readouts supply the unit for their numeric ticks.',
      render: withOverlaySurface(
        ({ ctx }) => <VerticalExample sliderSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'content',
      title: 'Long labels and formatted values',
      kind: 'content',
      mode: 'live',
      reset: true,
      caption:
        'Compare a reading width in pixels with an annual budget interval. Both labels and complete numeric amounts remain readable as the available width changes.',
      render: withOverlaySurface(
        ({ ctx }) => <ContentExample sliderSubject={ctx.subject} />,
        'border-box',
      ),
    },
    {
      id: 'overlay',
      title: 'Sliders on a floating surface',
      kind: 'surface',
      surface: 'overlay',
      overlayStage: true,
      mode: 'live',
      reset: true,
      caption:
        'Adjust the preview scale and the visible interval on a compact floating panel. Their caps retain a solid edge on each material.',
      render: ({ ctx }) => <OverlayExample sliderSubject={ctx.subject} />,
    },
  ],
  compositions: [
    {
      id: 'exact',
      title: 'Approximate adjustment and exact entry',
      mode: 'live',
      reset: true,
      caption:
        'Drag the slider or enter an exact percentage. Leaving an empty or out-of-range draft restores the last accepted value.',
      render: withOverlaySurface(
        ({ ctx }) => (
          <div className="slider-study-width">
            <ImageQuality sliderProps={ctx.subject} />
          </div>
        ),
        'border-box',
      ),
      code: exactSource,
    },
  ],
});
