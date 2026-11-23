import { useMemo } from 'react';
import type { JSX } from 'react';
import { createScale } from './scale.js';
import { SliderControl } from './SliderControl.js';
import type { RangeSliderProps, RangeSliderValue } from './types.js';
import './slider.css';

function idRefs(first?: string, second?: string): string | undefined {
  return (
    Array.from(new Set(`${first ?? ''} ${second ?? ''}`.trim().split(/\s+/))).join(' ') || undefined
  );
}

function snapshot(value: RangeSliderValue): RangeSliderValue {
  if (!Array.isArray(value) || value.length !== 2) {
    throw new RangeError('RangeSlider values must be an ordered pair of finite numbers.');
  }
  return [value[0], value[1]];
}

function normalizeLabel(label: string | undefined): string {
  return typeof label === 'string' ? label.trim().replace(/\s+/g, ' ') : '';
}

/** Select two independently adjustable bounds on the same stepped scale. */
export function RangeSlider({
  min = 0,
  max = 100,
  step = 1,
  minStepsBetweenThumbs = 0,
  id,
  ref,
  names,
  thumbLabels,
  inputRefs,
  inputProps,
  value,
  defaultValue,
  onValueChange,
  onValueCommit,
  'aria-label': label,
  'aria-labelledby': labelledBy,
  'aria-describedby': describedBy,
  'aria-details': details,
  ...props
}: RangeSliderProps): JSX.Element {
  const scale = useMemo(
    () => createScale(min, max, step, minStepsBetweenThumbs),
    [min, max, step, minStepsBetweenThumbs],
  );
  const [from, to] =
    Array.isArray(thumbLabels) && thumbLabels.length === 2
      ? [normalizeLabel(thumbLabels[0]), normalizeLabel(thumbLabels[1])]
      : ['', ''];
  if (!from || !to || from === to) {
    throw new RangeError('RangeSlider requires two nonempty, distinct thumb labels.');
  }

  return (
    <SliderControl
      {...props}
      scale={scale}
      group={{ id, ref, label, labelledBy, describedBy, details }}
      value={value === undefined ? undefined : snapshot(value)}
      defaultValue={
        defaultValue === undefined ? [scale.min, scale.maximum] : snapshot(defaultValue)
      }
      onChange={onValueChange && ((next) => onValueChange([next[0], next[1]!]))}
      onCommit={onValueCommit && ((next) => onValueCommit([next[0], next[1]!]))}
      thumbs={([0, 1] as const).map((thumb) => ({
        id: inputProps?.[thumb].id,
        ref: inputRefs?.[thumb],
        name: names?.[thumb],
        label: thumb === 0 ? from : to,
        describedBy: idRefs(inputProps?.[thumb]['aria-describedby'], describedBy),
        details: idRefs(inputProps?.[thumb]['aria-details'], details),
      }))}
    />
  );
}
