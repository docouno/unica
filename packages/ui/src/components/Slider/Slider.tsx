import { useMemo } from 'react';
import type { JSX } from 'react';
import { createScale } from './scale.js';
import { SliderControl } from './SliderControl.js';
import type { SliderProps } from './types.js';
import './slider.css';

/** Select a single numeric value on a stepped scale. */
export function Slider({
  min = 0,
  max = 100,
  step = 1,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  id,
  ref,
  name,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-details': details,
  ...props
}: SliderProps): JSX.Element {
  const scale = useMemo(() => createScale(min, max, step, 0), [min, max, step]);
  return (
    <SliderControl
      {...props}
      group={undefined}
      scale={scale}
      value={value === undefined ? undefined : [value]}
      defaultValue={[defaultValue ?? scale.valueAt(Math.ceil(scale.count / 2))]}
      onChange={onValueChange && ((next) => onValueChange(next[0]))}
      onCommit={onValueCommit && ((next) => onValueCommit(next[0]))}
      thumbs={[{ id, ref, name, label, labelledBy, describedBy, details }]}
    />
  );
}
