import { size, disabled, readOnly, choice, toggle, eventProp } from '../control-props.js';
import { useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { defineComponent } from '../../workbench/types.js';
import { RangeSlider, Slider } from '../../prototypes/slider/slider.proto.js';
import { NumberInput } from '../../prototypes/number-input/number-input.proto.js';

const percent = (value: number): string => `${value}%`;
const money = (value: number): string => `$${value.toLocaleString('en-US')}`;
const percentMarks = [
  { value: 0, label: '0%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
];

function Example({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <div className="slider-example-proto">
      <div className="slider-example-title-proto">{title}</div>
      {children}
    </div>
  );
}

function ExactValue(): ReactElement {
  const [value, setValue] = useState(60);
  return (
    <div className="slider-examples-proto">
      <div className="slider-pair-proto">
        <Slider
          label="Image quality"
          value={value}
          onValueChange={setValue}
          formatValue={percent}
          marks={percentMarks}
          description="Find a balance, or enter an exact percentage."
        />
        <NumberInput
          aria-label="Exact image quality percentage"
          value={value}
          onValueChange={(next) => {
            if (next !== '' && next >= 0 && next <= 100) {
              setValue(next);
            }
          }}
          suffix="%"
          min={0}
          max={100}
        />
      </div>
      <RangeSlider
        label="Price range"
        min={0}
        max={500}
        step={5}
        defaultValue={[100, 350]}
        formatValue={money}
        thumbLabels={['Minimum price', 'Maximum price']}
        marks={[
          { value: 0, label: '$0' },
          { value: 250, label: '$250' },
          { value: 500, label: '$500' },
        ]}
        description="Both bounds are inclusive. Adjust either end independently."
      />
    </div>
  );
}

function ErrorExample(): ReactElement {
  const [value, setValue] = useState(20);
  return (
    <Slider
      label="Export quality"
      value={value}
      onValueChange={setValue}
      formatValue={percent}
      status={value < 40 ? 'danger' : undefined}
      description={
        value < 40 ? 'Use at least 40% for this export.' : 'Quality meets the export requirement.'
      }
      marks={[
        { value: 0, label: '0%' },
        { value: 40, label: '40%' },
        { value: 100, label: '100%' },
      ]}
    />
  );
}

function RangeErrorExample(): ReactElement {
  const [value, setValue] = useState<readonly [number, number]>([10, 30]);
  const invalid = value[0] > 50 || value[1] < 50;
  return (
    <RangeSlider
      label="Allowed window"
      value={value}
      onValueChange={setValue}
      status={invalid ? 'danger' : undefined}
      preview="focus"
      previewThumb={1}
      description={
        invalid
          ? 'This window must include the reference value of 50.'
          : 'The window includes the reference value.'
      }
    />
  );
}

export default defineComponent({
  id: 'slider',
  title: 'Slider & RangeSlider',
  category: 'Forms',
  status: 'Proto',
  summary:
    'Open numeric scales, precise rectangular caps, and values that stay visible. Drag, click the rail, or use the arrow keys.',
  componentName: 'Slider',
  form: 'owned',
  props: {
    size,
    disabled,
    readOnly,
    orientation: choice(
      'Geometry',
      'Direction of the range.',
      ['horizontal', 'vertical'],
      'horizontal',
    ),
    showValue: toggle('Content', 'Show the current value above the rail.', true),
    onValueChange: eventProp('Reports the new slider value.', 'handleValueChange'),
  },
  render: function SliderPreview({ values, ctx }) {
    const [quality, setQuality] = useState(65);
    return (
      <form {...ctx.form} onReset={() => setQuality(65)}>
        <Slider
          {...values}
          {...ctx.subject}
          id={ctx.id}
          name="quality"
          label="Image quality"
          value={quality}
          formatValue={percent}
          onValueChange={(next) => {
            setQuality(next);
            ctx.action('onValueChange')(next);
          }}
        />
      </form>
    );
  },
  code: (_values, attributes) =>
    `<Slider label="Image quality" name="quality" value={quality} formatValue={percent}${attributes} />`,
  matrixViews: [
    {
      id: 'sizes',
      rows: 'size',
      cols: 'orientation',
      title: 'Slider · three sizes',
      caption:
        'Compact settings, standard forms, and spacious controls. Size changes the rail and cap; the full row remains interactive.',
      reference: () => (
        <div className="slider-examples-proto">
          <Example title="S · Compact">
            <Slider
              size="s"
              label="Typography scale"
              min={80}
              max={140}
              step={5}
              defaultValue={110}
              formatValue={percent}
              marks={[
                { value: 80, label: '80%' },
                { value: 110, label: '110%' },
                { value: 140, label: '140%' },
              ]}
            />
          </Example>
          <Example title="M · Default">
            <Slider
              label="Image quality"
              defaultValue={65}
              formatValue={percent}
              marks={percentMarks}
            />
          </Example>
          <Example title="L · Spacious">
            <Slider
              size="l"
              label="Playback volume"
              defaultValue={40}
              formatValue={percent}
              marks={percentMarks}
            />
          </Example>
        </div>
      ),
    },
  ],
  cases: [
    {
      id: 'range',
      title: 'RangeSlider · one shared scale',
      caption:
        'The selected interval sits between two stable bounds. A thumb stops at its neighbour without swapping or pushing it.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <Example title="S · Compact">
            <RangeSlider
              size="s"
              label="Context lines"
              min={0}
              max={20}
              defaultValue={[3, 12]}
              thumbLabels={['Minimum context lines', 'Maximum context lines']}
              marks={[
                { value: 0, label: '0' },
                { value: 10, label: '10' },
                { value: 20, label: '20 lines' },
              ]}
            />
          </Example>
          <Example title="M · Default">
            <RangeSlider
              label="Price range"
              min={0}
              max={1000}
              step={10}
              defaultValue={[200, 700]}
              formatValue={money}
              thumbLabels={['Minimum price', 'Maximum price']}
              marks={[
                { value: 0, label: '$0' },
                { value: 500, label: '$500' },
                { value: 1000, label: '$1,000' },
              ]}
            />
          </Example>
          <Example title="L · Spacious">
            <RangeSlider
              size="l"
              label="Brightness window"
              defaultValue={[25, 80]}
              formatValue={percent}
              marks={percentMarks}
            />
          </Example>
        </div>
      ),
    },
    {
      id: 'interaction',
      title: 'Interaction · quiet, local feedback',
      caption:
        'Hover, drag and focus are pinned visual previews. Every example also accepts live input. Focus outlines the cap, never the whole field.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <Slider label="Rest" defaultValue={60} formatValue={percent} />
          <Slider
            label="Hover the hit area"
            defaultValue={60}
            formatValue={percent}
            preview="hover"
          />
          <Slider label="Dragging" defaultValue={60} formatValue={percent} preview="active" />
          <Slider label="Keyboard focus" defaultValue={60} formatValue={percent} preview="focus" />
          <RangeSlider
            label="Lower bound focused"
            defaultValue={[25, 70]}
            formatValue={percent}
            preview="focus"
            previewThumb={0}
          />
          <RangeSlider
            label="Upper bound focused"
            defaultValue={[25, 70]}
            formatValue={percent}
            preview="focus"
            previewThumb={1}
          />
          <RangeSlider
            label="Upper bound dragging"
            defaultValue={[25, 70]}
            formatValue={percent}
            preview="active"
            previewThumb={1}
          />
        </div>
      ),
    },
    {
      id: 'availability',
      title: 'Availability & validation',
      caption:
        'Read-only values keep their contrast and keyboard focus. Disabled controls are neutral. Validation updates as you adjust the values. The interval example pins keyboard focus on its upper cap.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <Slider
            label="Managed quality"
            defaultValue={75}
            formatValue={percent}
            readOnly
            description="Set by your workspace policy."
          />
          <RangeSlider
            label="Managed interval"
            defaultValue={[20, 80]}
            readOnly
            description="These bounds are set by your workspace."
          />
          <Slider
            label="Preview volume"
            defaultValue={40}
            formatValue={percent}
            disabled
            description="Available when audio preview is enabled."
          />
          <RangeSlider
            label="Export range"
            defaultValue={[15, 60]}
            disabled
            description="Select a document to choose a range."
          />
          <ErrorExample />
          <RangeErrorExample />
        </div>
      ),
    },
    {
      id: 'bounds',
      title: 'Bounds, precision & reference marks',
      caption:
        'Caps sit flush with the ends. Reference marks explain a linear scale; they do not change its step or create extra snap points.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <Slider label="Minimum" defaultValue={0} formatValue={percent} marks={percentMarks} />
          <Slider label="Maximum" defaultValue={100} formatValue={percent} marks={percentMarks} />
          <Slider
            label="Line spacing"
            min={1}
            max={2}
            step={0.05}
            defaultValue={1.45}
            formatValue={(value) => `${value.toFixed(2)}×`}
            marks={[
              { value: 1, label: '1.00×' },
              { value: 1.5, label: '1.50×' },
              { value: 2, label: '2.00×' },
            ]}
          />
          <Slider
            label="Exposure compensation"
            min={-2}
            max={2}
            step={0.1}
            defaultValue={-0.7}
            formatValue={(value) => `${value > 0 ? '+' : ''}${value.toFixed(1)} EV`}
            marks={[
              { value: -2, label: '−2' },
              { value: -1, label: '−1' },
              { value: 0, label: '0' },
              { value: 1, label: '+1' },
              { value: 2, label: '+2 EV' },
            ]}
          />
          <RangeSlider
            label="Full interval"
            defaultValue={[0, 100]}
            formatValue={percent}
            marks={percentMarks}
          />
        </div>
      ),
    },
    {
      id: 'close-bounds',
      title: 'Close & coincident bounds',
      caption:
        'Crowded caps separate across the rail while keeping their exact numeric positions. Grab either cap, or drag from the shared point toward the bound you want to open.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <RangeSlider
            label="Close together"
            defaultValue={[49, 51]}
            formatValue={percent}
            marks={percentMarks}
          />
          <RangeSlider
            label="A single point"
            defaultValue={[50, 50]}
            formatValue={percent}
            marks={percentMarks}
          />
          <RangeSlider
            label="Both at minimum"
            defaultValue={[0, 0]}
            formatValue={percent}
            marks={percentMarks}
          />
          <RangeSlider
            label="Both at maximum"
            defaultValue={[100, 100]}
            formatValue={percent}
            marks={percentMarks}
          />
          <RangeSlider
            label="Minimum separation"
            defaultValue={[40, 50]}
            step={5}
            minStepsBetweenThumbs={2}
            description="Keep at least 10 units between the bounds. Neither thumb pushes the other."
          />
        </div>
      ),
    },
    {
      id: 'vertical',
      title: 'Vertical · minimum at the bottom',
      caption:
        'Labels and values remain horizontal. The cap turns across the scale; direction never changes the bottom-to-top numeric order.',
      kind: 'behavior',
      render: () => (
        <div className="slider-vertical-examples-proto">
          <Slider
            label="Level"
            size="s"
            orientation="vertical"
            defaultValue={65}
            formatValue={percent}
            marks={percentMarks}
          />
          <RangeSlider
            label="Window"
            orientation="vertical"
            defaultValue={[25, 75]}
            marks={percentMarks}
          />
          <RangeSlider
            label="Point"
            size="l"
            orientation="vertical"
            defaultValue={[50, 50]}
            preview="focus"
            previewThumb={1}
          />
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Long labels & formatted values',
      caption:
        'The header wraps naturally. Numeric endpoints remain readable at narrow widths and 120% text; values are never truncated.',
      kind: 'behavior',
      render: () => (
        <div className="slider-examples-proto">
          <Slider
            label="Maximum width of the reading column on larger displays"
            min={600}
            max={1600}
            step={20}
            defaultValue={1040}
            formatValue={(value) => `${value.toLocaleString('en-US')} px`}
            marks={[
              { value: 600, label: '600 px' },
              { value: 1100, label: '1,100 px' },
              { value: 1600, label: '1,600 px' },
            ]}
          />
          <RangeSlider
            label="Annual project budget, including optional support"
            min={0}
            max={500000}
            step={1000}
            defaultValue={[125000, 275000]}
            formatValue={(value) => `USD ${value.toLocaleString('en-US')}`}
            thumbLabels={['Minimum annual budget', 'Maximum annual budget']}
            description="Displayed amounts include all selected services."
          />
        </div>
      ),
    },
    {
      id: 'overlay',
      title: 'Inside a floating surface',
      surface: 'overlay',
      overlayStage: true,
      caption:
        'The same controls inherit the surface recipe. Glass belongs to the floating panel and recessed track; caps remain solid and legible.',
      kind: 'surface',
      render: () => (
        <div className="slider-overlay-proto slider-examples-proto">
          <Slider
            label="Preview scale"
            min={50}
            max={150}
            step={5}
            defaultValue={100}
            formatValue={percent}
            marks={[
              { value: 50, label: '50%' },
              { value: 100, label: '100%' },
              { value: 150, label: '150%' },
            ]}
          />
          <RangeSlider
            label="Visible interval"
            defaultValue={[20, 80]}
            formatValue={percent}
            marks={percentMarks}
          />
        </div>
      ),
    },
  ],
  usage: [
    {
      id: 'exact',
      title: 'Approximate adjustment & exact entry',
      caption:
        'A separate numeric input is useful when precision matters. It shares the value, without becoming part of the slider anatomy.',
      code: `<>
  <Slider label="Image quality" value={quality} onValueChange={setQuality} />
  <NumberInput
    aria-label="Exact image quality percentage"
    value={quality}
    onValueChange={setQuality}
    min={0}
    max={100}
    suffix="%"
  />
</>`,
      render: () => <ExactValue />,
    },
  ],
});
