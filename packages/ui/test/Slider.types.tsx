import { createRef } from 'react';
import { RangeSlider, Slider } from '../src/index.js';
import type { RangeSliderProps, RangeSliderValue, SliderMark, SliderProps } from '../src/index.js';
import type {
  RangeSliderProps as ServerRangeSliderProps,
  RangeSliderValue as ServerRangeSliderValue,
  SliderMark as ServerSliderMark,
  SliderOrientation,
  SliderProps as ServerSliderProps,
  SliderSize,
  SliderStatus,
  SliderValueFormatter,
} from '../src/server.js';

const thumb = createRef<HTMLInputElement>();
const group = createRef<HTMLDivElement>();
const range: ServerRangeSliderValue = [10, 90] as const;
const marks: readonly ServerSliderMark[] = [{ value: 20, label: undefined }];
const formatValue: SliderValueFormatter = (value) => `${value}%`;
const orientation: SliderOrientation = 'vertical';
const size: SliderSize = 'l';
const status: SliderStatus = 'danger';
const slider: ServerSliderProps = {
  ref: thumb,
  onValueChange: undefined,
  orientation,
  size,
  status,
};
const pair: ServerRangeSliderProps = {
  ref: group,
  inputRefs: [thumb, thumb],
  inputProps: [{ id: 'lower' }, { 'aria-details': 'help' }],
  value: range,
  thumbLabels: ['Min', 'Max'],
  names: ['from', 'to'],
  formatValue,
  marks,
};

export const scalarProps: SliderProps = slider;
export const rangeProps: RangeSliderProps = pair;
export const referenceMarks: readonly SliderMark[] = marks;

export const scalar = (
  <Slider {...slider} name="scale" data-consumer="" onValueCommit={(value: number) => value} />
);
export const interval = (
  <RangeSlider {...pair} onValueCommit={(value: RangeSliderValue) => value} />
);

// @ts-expect-error Scalar values are numbers.
export const wrongScalar = <Slider value={[1, 3]} />;
// @ts-expect-error Range values are ordered pairs.
export const wrongRange = <RangeSlider value={5} thumbLabels={['Lower', 'Upper']} />;
// @ts-expect-error Distinct thumb names are required by the API.
export const unnamed = <RangeSlider />;
// @ts-expect-error Slider forwards its ref to the native input.
export const wrongRef = <Slider ref={group} />;
// @ts-expect-error The consumer cannot swap the native carrier type.
export const wrongType = <Slider type="text" />;
// @ts-expect-error The native step is numeric.
export const wrongStep = <Slider step="1" />;
// @ts-expect-error Labels are composed by the owner of the field.
export const shorthand = <Slider label="Name" />;
// @ts-expect-error Feedback is neutral or danger for this family.
export const warning = <Slider status="warning" />;
// @ts-expect-error The native input event would be a competing value API.
export const wrongChange = <Slider onChange={() => {}} />;
export const wrongThumb = (
  // @ts-expect-error Consumers cannot override the thumb's role.
  <RangeSlider thumbLabels={['Min', 'Max']} inputProps={[{ role: 'button' }, {}]} />
);
