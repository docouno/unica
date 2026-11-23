import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { RangeSlider, Slider } from '@docouno/unica';
import type { RangeSliderProps, RangeSliderValue, SliderProps } from '@docouno/unica';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { NumberInput } from '../../prototypes/number-input/number-input.proto.js';
import './slider.examples.css';

type FieldContent = {
  readonly label: string;
  readonly description?: string | undefined;
};

function Message({
  id,
  text,
  invalid,
}: {
  readonly id: string;
  readonly text: string | undefined;
  readonly invalid: boolean;
}): ReactElement | null {
  if (!text) {
    return null;
  }
  return (
    <div className="slider-field-message" id={id} data-danger={invalid || undefined}>
      {invalid && <WarningCircleIcon aria-hidden="true" />}
      {text}
    </div>
  );
}

function SliderField({
  label,
  description,
  value,
  defaultValue = 50,
  formatValue = String,
  onValueChange,
  ...props
}: Omit<SliderProps, 'label' | 'description'> & FieldContent): ReactElement {
  const id = useId();
  const [local, setLocal] = useState(defaultValue);
  const current = value ?? local;
  return (
    <div className="slider-field">
      <div
        className="slider-field-heading"
        data-size={props.size}
        data-vertical={props.orientation === 'vertical' || undefined}
        data-disabled={props.disabled || undefined}
      >
        <label htmlFor={id}>{label}</label>
        <span className="slider-field-value">
          <bdi>{formatValue(current)}</bdi>
        </span>
      </div>
      <Slider
        {...props}
        id={id}
        value={current}
        formatValue={formatValue}
        showValue={false}
        aria-describedby={description ? `${id}-message` : undefined}
        onValueChange={(next) => {
          setLocal(next);
          onValueChange?.(next);
        }}
      />
      <Message
        id={`${id}-message`}
        text={description}
        invalid={props.status === 'danger' && !props.disabled}
      />
    </div>
  );
}

function RangeField({
  label,
  description,
  value,
  defaultValue = [30, 80],
  formatValue = String,
  onValueChange,
  thumbLabels = ['Lower bound', 'Upper bound'],
  ...props
}: Omit<RangeSliderProps, 'label' | 'description' | 'thumbLabels'> &
  FieldContent & {
    readonly thumbLabels?: RangeSliderProps['thumbLabels'];
  }): ReactElement {
  const id = useId();
  const [local, setLocal] = useState(defaultValue);
  const current: RangeSliderValue = value ?? local;
  return (
    <div className="slider-field">
      <div
        className="slider-field-heading"
        data-size={props.size}
        data-vertical={props.orientation === 'vertical' || undefined}
        data-disabled={props.disabled || undefined}
      >
        <span id={id}>{label}</span>
        <span className="slider-field-value" dir="ltr">
          <bdi>{formatValue(current[0])}</bdi> — <bdi>{formatValue(current[1])}</bdi>
        </span>
      </div>
      <RangeSlider
        {...props}
        aria-labelledby={id}
        thumbLabels={thumbLabels}
        value={current}
        formatValue={formatValue}
        showValue={false}
        aria-describedby={description ? `${id}-message` : undefined}
        onValueChange={(next) => {
          setLocal(next);
          onValueChange?.(next);
        }}
      />
      <Message
        id={`${id}-message`}
        text={description}
        invalid={props.status === 'danger' && !props.disabled}
      />
    </div>
  );
}

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
    <div className="slider-example">
      <div className="slider-example-title">{title}</div>
      {children}
    </div>
  );
}

export function ExactValue(): ReactElement {
  const [value, setValue] = useState(60);
  const [entry, setEntry] = useState<number | ''>(value);
  return (
    <div className="slider-examples">
      <div className="slider-pair-example">
        <SliderField
          label="Image quality"
          value={value}
          onValueChange={(next) => {
            setValue(next);
            setEntry(next);
          }}
          formatValue={percent}
          marks={percentMarks}
          description="Drag for a quick adjustment or enter a whole percentage."
        />
        <NumberInput
          aria-label="Exact image quality percentage"
          value={entry}
          onValueChange={(next) => {
            setEntry(next);
            if (next !== '' && next >= 0 && next <= 100) {
              setValue(Math.round(next));
            }
          }}
          onBlur={() => setEntry(value)}
          suffix="%"
          min={0}
          max={100}
        />
      </div>
      <RangeField
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
    <SliderField
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
    <RangeField
      label="Allowed window"
      value={value}
      onValueChange={setValue}
      status={invalid ? 'danger' : undefined}
      description={
        invalid
          ? 'This window must include the reference value of 50.'
          : 'The window includes the reference value.'
      }
    />
  );
}

export function SizesExample(): ReactElement {
  return (
    <div className="slider-examples">
      <Example title="S · Compact">
        <SliderField
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
        <SliderField
          label="Image quality"
          defaultValue={65}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
      <Example title="L · Spacious">
        <SliderField
          size="l"
          label="Playback volume"
          defaultValue={40}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
    </div>
  );
}

export function RangeExample(): ReactElement {
  return (
    <div className="slider-examples">
      <Example title="S · Compact">
        <RangeField
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
        <RangeField
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
        <RangeField
          size="l"
          label="Brightness window"
          defaultValue={[25, 80]}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
    </div>
  );
}

export function InteractionExample(): ReactElement {
  return (
    <div className="slider-examples">
      <SliderField label="Image quality" defaultValue={60} formatValue={percent} />
      <RangeField label="Playback window" defaultValue={[25, 70]} formatValue={percent} />
    </div>
  );
}

export function AvailabilityExample(): ReactElement {
  return (
    <div className="slider-examples">
      <SliderField
        label="Managed quality"
        defaultValue={75}
        formatValue={percent}
        readOnly
        description="Set by your workspace policy."
      />
      <RangeField
        label="Managed interval"
        defaultValue={[20, 80]}
        readOnly
        description="These bounds are set by your workspace."
      />
      <SliderField
        label="Preview volume"
        defaultValue={40}
        formatValue={percent}
        disabled
        description="Available when audio preview is enabled."
      />
      <RangeField
        label="Export range"
        defaultValue={[15, 60]}
        disabled
        description="Select a document to choose a range."
      />
      <ErrorExample />
      <RangeErrorExample />
    </div>
  );
}

export function BoundsExample(): ReactElement {
  return (
    <div className="slider-examples">
      <SliderField label="Minimum" defaultValue={0} formatValue={percent} marks={percentMarks} />
      <SliderField label="Maximum" defaultValue={100} formatValue={percent} marks={percentMarks} />
      <SliderField
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
      <SliderField
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
      <RangeField
        label="Full interval"
        defaultValue={[0, 100]}
        formatValue={percent}
        marks={percentMarks}
      />
    </div>
  );
}

export function CloseBoundsExample(): ReactElement {
  return (
    <div className="slider-examples">
      <RangeField
        label="Close together"
        defaultValue={[49, 51]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        label="A single point"
        defaultValue={[50, 50]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        label="Both at minimum"
        defaultValue={[0, 0]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        label="Both at maximum"
        defaultValue={[100, 100]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        label="Minimum separation"
        defaultValue={[40, 50]}
        step={5}
        minStepsBetweenThumbs={2}
        description="Keep at least 10 units between the bounds. Neither thumb pushes the other."
      />
    </div>
  );
}

export function VerticalExample(): ReactElement {
  return (
    <div className="slider-vertical-examples">
      <SliderField
        label="Level"
        size="s"
        orientation="vertical"
        defaultValue={65}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        label="Window"
        orientation="vertical"
        defaultValue={[25, 75]}
        marks={percentMarks}
      />
      <RangeField label="Point" size="l" orientation="vertical" defaultValue={[50, 50]} />
    </div>
  );
}

export function ContentExample(): ReactElement {
  return (
    <div className="slider-examples">
      <SliderField
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
      <RangeField
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
  );
}

export function OverlayExample(): ReactElement {
  return (
    <div className="slider-overlay-example slider-examples">
      <SliderField
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
      <RangeField
        label="Visible interval"
        defaultValue={[20, 80]}
        formatValue={percent}
        marks={percentMarks}
      />
    </div>
  );
}
