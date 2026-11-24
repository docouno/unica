import { useId, useState } from 'react';
import type { ReactElement, ReactNode } from 'react';
import { Flex, Icon, RangeSlider, Slider, Stack, Text } from '@docouno/unica';
import type { PreviewProps } from '../../workbench/types.js';
import type { RangeSliderProps, RangeSliderValue, SliderProps } from '@docouno/unica';
import { WarningCircleIcon } from '@phosphor-icons/react';
import { percent } from './slider.controls.js';
import './slider.examples.css';

type FieldContent = {
  readonly label: string;
  readonly description?: string | undefined;
};

interface StudyProps {
  readonly rangeSubject?: PreviewProps['ctx']['subject'] | undefined;
  readonly sliderSubject?: PreviewProps['ctx']['subject'] | undefined;
}

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
    <Flex id={id} align="baseline" gap={4}>
      {invalid && <Icon icon={WarningCircleIcon} size="s" color="danger" />}
      <Text as="span" size="caption-l" color={invalid ? 'danger' : 'secondary'}>
        <bdi>{text}</bdi>
      </Text>
    </Flex>
  );
}

function Heading({
  label,
  id,
  range = false,
  size = 'm',
  orientation,
  disabled,
  children,
}: Pick<SliderProps, 'size' | 'orientation' | 'disabled'> & {
  readonly id: string;
  readonly label: string;
  readonly range?: boolean;
  readonly children: ReactNode;
}): ReactElement {
  const textSize = size === 's' ? 'body-xs' : size === 'l' ? 'body-m' : 'body-s';
  return (
    <Flex
      align="baseline"
      wrap="wrap"
      gap={4}
      justify={orientation === 'vertical' ? 'center' : 'space-between'}
      className="slider-field-heading"
    >
      {range ? (
        <Text as="span" id={id} size={textSize}>
          <bdi>{label}</bdi>
        </Text>
      ) : (
        <Text as="label" htmlFor={id} size={textSize}>
          <bdi>{label}</bdi>
        </Text>
      )}
      <Text
        as="span"
        size="caption-l"
        color={disabled ? 'muted' : 'secondary'}
        className="slider-field-value"
      >
        {children}
      </Text>
    </Flex>
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
    <Stack gap={0}>
      <Heading
        label={label}
        id={id}
        size={props.size}
        orientation={props.orientation}
        disabled={props.disabled}
      >
        <bdi>{formatValue(current)}</bdi>
      </Heading>
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
    </Stack>
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
    <Stack gap={0}>
      <Heading
        label={label}
        id={id}
        size={props.size}
        orientation={props.orientation}
        disabled={props.disabled}
        range
      >
        <bdi dir="ltr">
          {formatValue(current[0])} — {formatValue(current[1])}
        </bdi>
      </Heading>
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
    </Stack>
  );
}

const money = (value: number): string => `$${value.toLocaleString('en-US')}`;
const percentMarks = [
  { value: 0, label: '0%' },
  { value: 50, label: '50%' },
  { value: 100, label: '100%' },
];

const verticalPercentMarks = percentMarks.map(({ value }) => ({ value, label: String(value) }));

function Example({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Stack gap={12}>
      <Text as="span" size="caption-l" color="secondary">
        <bdi>{title}</bdi>
      </Text>
      {children}
    </Stack>
  );
}

function ErrorExample({ sliderSubject }: StudyProps = {}): ReactElement {
  const [value, setValue] = useState(20);
  return (
    <SliderField
      {...sliderSubject}
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

function RangeErrorExample({ rangeSubject }: StudyProps = {}): ReactElement {
  const [value, setValue] = useState<readonly [number, number]>([10, 30]);
  const invalid = value[0] > 50 || value[1] < 50;
  return (
    <RangeField
      {...rangeSubject}
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

export function SizesExample({ sliderSubject }: StudyProps): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <Example title="S · Compact">
        <SliderField
          {...sliderSubject}
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
          {...sliderSubject}
          label="Image quality"
          defaultValue={65}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
      <Example title="L · Spacious">
        <SliderField
          {...sliderSubject}
          size="l"
          label="Playback volume"
          defaultValue={40}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
    </Stack>
  );
}

export function RangeExample({ rangeSubject }: StudyProps = {}): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <Example title="S · Compact">
        <RangeField
          {...rangeSubject}
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
          {...rangeSubject}
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
          {...rangeSubject}
          size="l"
          label="Brightness window"
          defaultValue={[25, 80]}
          formatValue={percent}
          marks={percentMarks}
        />
      </Example>
    </Stack>
  );
}

export function InteractionExample({ sliderSubject }: StudyProps): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <SliderField
        {...sliderSubject}
        label="Image quality"
        defaultValue={60}
        formatValue={percent}
      />
      <RangeField label="Playback window" defaultValue={[25, 70]} formatValue={percent} />
    </Stack>
  );
}

export function AvailabilityExample({
  rangeSubject,
  sliderSubject,
}: StudyProps = {}): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <SliderField
        {...sliderSubject}
        label="Managed quality"
        defaultValue={75}
        formatValue={percent}
        readOnly
        description="Set by your workspace policy."
      />
      <RangeField
        {...rangeSubject}
        label="Managed interval"
        defaultValue={[20, 80]}
        readOnly
        description="These bounds are set by your workspace."
      />
      <SliderField
        {...sliderSubject}
        label="Preview volume"
        defaultValue={40}
        formatValue={percent}
        disabled
        description="Available when audio preview is enabled."
      />
      <RangeField
        {...rangeSubject}
        label="Export range"
        defaultValue={[15, 60]}
        disabled
        description="Select a document to choose a range."
      />
      <ErrorExample sliderSubject={sliderSubject} />
      <RangeErrorExample rangeSubject={rangeSubject} />
    </Stack>
  );
}

export function BoundsExample({ sliderSubject }: StudyProps): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <SliderField
        {...sliderSubject}
        label="Minimum"
        defaultValue={0}
        formatValue={percent}
        marks={percentMarks}
      />
      <SliderField
        {...sliderSubject}
        label="Maximum"
        defaultValue={100}
        formatValue={percent}
        marks={percentMarks}
      />
      <SliderField
        {...sliderSubject}
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
        {...sliderSubject}
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
    </Stack>
  );
}

export function CloseBoundsExample({ rangeSubject }: StudyProps = {}): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width slider-close-bounds">
      <RangeField
        {...rangeSubject}
        label="Close together"
        defaultValue={[49, 51]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="A single point"
        defaultValue={[50, 50]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="Both at minimum"
        defaultValue={[0, 0]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="Both at maximum"
        defaultValue={[100, 100]}
        formatValue={percent}
        marks={percentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="Minimum separation"
        defaultValue={[40, 50]}
        step={5}
        minStepsBetweenThumbs={2}
        description="Keep at least 10 units between the bounds."
      />
    </Stack>
  );
}

export function VerticalExample({ rangeSubject, sliderSubject }: StudyProps = {}): ReactElement {
  return (
    <div className="slider-study-width slider-vertical-examples">
      <SliderField
        {...sliderSubject}
        label="Level"
        size="s"
        orientation="vertical"
        defaultValue={65}
        formatValue={percent}
        marks={verticalPercentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="Window"
        formatValue={percent}
        orientation="vertical"
        defaultValue={[25, 75]}
        marks={verticalPercentMarks}
      />
      <RangeField
        {...rangeSubject}
        label="Point"
        size="l"
        orientation="vertical"
        defaultValue={[50, 50]}
      />
    </div>
  );
}

export function ContentExample({ rangeSubject, sliderSubject }: StudyProps = {}): ReactElement {
  return (
    <Stack gap={24} className="slider-study-width">
      <SliderField
        {...sliderSubject}
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
        {...rangeSubject}
        label="Annual project budget, including optional support"
        min={0}
        max={500000}
        step={1000}
        defaultValue={[125000, 275000]}
        formatValue={(value) => `USD ${value.toLocaleString('en-US')}`}
        thumbLabels={['Minimum annual budget', 'Maximum annual budget']}
        description="Displayed amounts include all selected services."
      />
    </Stack>
  );
}

export function OverlayExample({ rangeSubject, sliderSubject }: StudyProps = {}): ReactElement {
  return (
    <Stack gap={24} className="unica-overlay-surface slider-overlay-example" data-surface="overlay">
      <SliderField
        {...sliderSubject}
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
        {...rangeSubject}
        label="Visible interval"
        defaultValue={[20, 80]}
        formatValue={percent}
        marks={percentMarks}
      />
    </Stack>
  );
}

export function ControlledRange({ ctx }: PreviewProps): ReactElement {
  const id = useId();
  const [value, setValue] = useState<RangeSliderValue>([25, 75]);
  const [proposal, reportProposal] = useState<RangeSliderValue>();
  const [committed, reportCommit] = useState<RangeSliderValue>();
  return (
    <Stack gap={8} className="slider-study-width">
      <Text as="span" id={id} size="body-s">
        Price range
      </Text>
      <RangeSlider
        {...ctx.subject}
        aria-labelledby={id}
        thumbLabels={['Minimum price', 'Maximum price']}
        value={value}
        onValueChange={(next) => {
          reportProposal(next);
          if (ctx.story?.controls.accept !== false) {
            setValue(next);
          }
        }}
        onValueCommit={reportCommit}
      />
      <Text as="p" size="caption-l" color="secondary">
        <bdi>
          Proposed: <bdi dir="ltr">{proposal?.join(' — ') ?? 'None'}</bdi>
        </bdi>
      </Text>
      <Text as="p" size="caption-l" color="secondary">
        <bdi>
          Last committed: <bdi dir="ltr">{committed?.join(' — ') ?? 'None'}</bdi>
        </bdi>
      </Text>
    </Stack>
  );
}
