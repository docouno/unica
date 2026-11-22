import { RangeSlider, Slider } from '@docouno/unica';
import type { ReactElement } from 'react';

const grids = [
  { min: 0, max: 1, step: 0.3, data: [0.3, 0.9] },
  { min: -0.3, max: 0.3, step: 0.1, data: [-0.2, 0.3] },
  { min: 0, max: 1e-8, step: 1e-9, data: [3e-9, 4e-9] },
  { min: 999999.98, max: 1000000, step: 0.01, data: [999999.98, 999999.99] },
  { min: -1e15, max: 1e15, step: 1, data: [0, 1] },
  { min: 1e300, max: 1e300, step: 1e-290, data: [1e300, 1e300] },
] as const;

export default function SliderSsr(): ReactElement {
  return (
    <>
      {grids.map(({ min, max, step, data }, index) => (
        <form key={min + ' ' + max} data-testid={`numeric-${index}`}>
          <Slider
            aria-label={`Number ${index}`}
            name="solo"
            min={min}
            max={max}
            step={step}
            defaultValue={data[0]}
          />
          <RangeSlider
            aria-label={`Interval ${index}`}
            thumbLabels={['From', 'To']}
            names={['low', 'high']}
            min={min}
            max={max}
            step={step}
            defaultValue={data}
          />
        </form>
      ))}
    </>
  );
}
