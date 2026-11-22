import { useCallback, useRef } from 'react';
import type { RefObject } from 'react';
import { writeInputValue } from '../../core/forms/carriers.js';
import type { FormValueState, FormWriteContext } from '../../core/forms/useFormValue.js';
import { useFormValue } from '../../core/forms/useFormValue.js';
import { equalValues, normalizeValues, serializeValue, thumbBounds } from './scale.js';
import type { SliderScale, SliderValues } from './scale.js';

export type Thumb = 0 | 1;
export type SliderInputs = readonly [
  RefObject<HTMLInputElement | null>,
  RefObject<HTMLInputElement | null>,
];

export interface SliderFormOptions {
  readonly inputs: SliderInputs;
  readonly scale: SliderScale;
  readonly value: SliderValues | undefined;
  readonly defaultValue: SliderValues;
  readonly onChange: ((value: SliderValues) => void) | undefined;
  readonly readOnly: boolean;
  readonly onReset: () => void;
}

function boundsFor(
  scale: SliderScale,
  value: SliderValues,
  thumb: Thumb,
  resetValue?: SliderValues,
): readonly [string, string] {
  let [min, max] = thumbBounds(scale, value, thumb);
  if (resetValue) {
    const resetIndex = scale.indexOf(resetValue[thumb]!);
    min = Math.min(min, resetIndex);
    max = Math.max(max, resetIndex);
  }
  return [serializeValue(scale.valueAt(min)), serializeValue(scale.valueAt(max))];
}

export function nativeNumbers(
  scale: SliderScale,
  value: SliderValues,
  thumb: Thumb,
): { min: string; max: string; step: string; defaultValue: string } {
  const [min, max] = boundsFor(scale, value, thumb);
  return {
    min,
    max,
    step: serializeValue(scale.step),
    defaultValue: serializeValue(value[thumb]!),
  };
}

export function useSliderForm({
  inputs,
  scale,
  value,
  defaultValue,
  onChange,
  readOnly,
  onReset,
}: SliderFormOptions): FormValueState<SliderValues> {
  const resetCount = useRef(0);
  const range = defaultValue.length === 2;
  const getControls = useCallback(() => [inputs[0].current, inputs[1].current], [inputs]);

  function write(next: SliderValues, context: FormWriteContext<SliderValues>): void {
    const target = context.controlled ? next : normalizeValues(scale, context.defaultValue);
    const nodes = getControls();
    // Write both bounds before either value. Setting a range bound can sanitize
    // the browser's live value immediately.
    for (const thumb of [0, 1] as const) {
      const input = nodes[thumb];
      if (!input) {
        continue;
      }
      const [min, max] = boundsFor(scale, next, thumb, resetCount.current > 0 ? target : undefined);
      const step = serializeValue(scale.step);
      if (input.min !== min) {
        input.min = min;
      }
      if (input.max !== max) {
        input.max = max;
      }
      if (input.step !== step) {
        input.step = step;
      }
    }
    for (const thumb of [0, 1] as const) {
      const input = nodes[thumb];
      if (!input) {
        continue;
      }
      writeInputValue(input, serializeValue(next[thumb]!), { force: context.force });
      const baseline = serializeValue(target[thumb]!);
      if (input.defaultValue !== baseline) {
        input.defaultValue = baseline;
      }
    }
  }

  return useFormValue({
    value,
    defaultValue,
    onChange,
    isEqual: equalValues,
    normalize: (next) => normalizeValues(scale, next),
    readOnly,
    getControls: range ? getControls : undefined,
    getControl: range ? undefined : () => inputs[0].current,
    writeDeps: [scale],
    onReset,
    write,
    prepareReset: range
      ? (current, baseline) => {
          resetCount.current++;
          write(current, { controlled: value !== undefined, defaultValue: baseline, force: false });
          return () => {
            resetCount.current--;
          };
        }
      : undefined,
  });
}
