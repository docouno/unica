// @vitest-environment node
import type { JSX } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { RangeSlider, Slider } from '../src/index.js';

it('serializes projected native values and per-thumb bounds before hydration', () => {
  const html = renderToString(
    <form id="prices">
      <label htmlFor="zoom">Zoom</label>
      <Slider id="zoom" name="zoom" min={0} max={1} step={0.3} defaultValue={1} />
      <RangeSlider
        id="window"
        aria-label="Price window"
        aria-describedby="help error"
        thumbLabels={['From', 'To']}
        names={['low', 'high']}
        form="prices"
        min={-0.3}
        max={0.3}
        step={0.1}
        minStepsBetweenThumbs={1}
        defaultValue={[-0.1, 0.1]}
        inputProps={[{ id: 'lo', 'aria-describedby': 'specific help' }, { id: 'hi' }]}
        status="danger"
        showValue={false}
        formatValue={(value) => `${value} dollars`}
      />
    </form>,
  );
  const tags = html.match(/<input\b[^>]*>/g) ?? [];
  expect(tags).toHaveLength(3);
  expect(tags[0]).toContain('id="zoom"');
  expect(tags[0]).toContain('max="0.9"');
  expect(tags[0]).toContain('value="0.9"');
  expect(tags[1]).toContain('aria-describedby="specific help error"');
  expect(tags[1]).toContain('aria-valuetext="-0.1 dollars"');
  expect(tags[1]).toContain('max="0"');
  expect(tags[2]).toContain('min="0"');
  expect(tags[2]).toContain('value="0.1"');
  expect(tags[2]).toContain('form="prices"');
  expect(html).toContain('role="group" aria-invalid="true"');
  expect(html).not.toContain('aria-valuemin');
  expect(html).not.toContain('aria-valuemax');
});

it.each([
  <Slider min={9.9999999999996e-7} max={1.00000000000005e-6} step={3e-20} />,
  <Slider min={-1.00000000000005e-6} max={-9.9999999999996e-7} step={3e-20} />,
  <Slider min={0} max={1.8e-6} step={3e-20} />,
  <Slider min={9.9999999999998e-7} max={2e-6} step={1.00000000000002e-6} />,
  <Slider min={-2.4e-308} max={2.6e-308} step={2.5e-308} />,
  <Slider min={999999999999999} max={1000000000000010} step={11} />,
  <Slider defaultValue={NaN} />,
  <Slider marks={[{ value: 0 }, { value: -0 }]} />,
  <RangeSlider thumbLabels={['Lower', 'Upper']} value={[70, 30]} />,
  <RangeSlider thumbLabels={['Lower', 'Upper']} minStepsBetweenThumbs={101} />,
  <RangeSlider thumbLabels={['Same', 'Same ']} />,
  <RangeSlider thumbLabels={['Same name', 'Same   name']} />,
])('rejects an unsupported slider before rendering its input %#', (example: JSX.Element) => {
  expect(() => renderToString(example)).toThrow(RangeError);
});
