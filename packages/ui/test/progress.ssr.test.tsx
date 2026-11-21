// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Progress, ProgressCircle, Spinner } from '../src/index.js';

it('renders distinct accessible names and the live measurement in Node SSR', () => {
  expect(typeof window).toBe('undefined');
  expect(typeof document).toBe('undefined');
  const html = renderToString(
    <>
      <Spinner delay={150} aria-label="Checking" />
      <Progress value={42} max={80} label="Archive transfer" />
      <Progress value={null} label="Preparing export" />
      <ProgressCircle value={42} max={80} aria-label="Compact transfer" />
    </>,
  );
  const ids = [...html.matchAll(/aria-labelledby="([^"]+)"/g)].map((match) => match[1]);
  expect(new Set(ids).size).toBe(2);
  for (const id of ids) {
    expect(html).toContain(`id="${id}"`);
  }
  expect(html.match(/aria-valuenow="42"/g)).toHaveLength(2);
  expect(html.match(/aria-valuemax="80"/g)).toHaveLength(2);
  expect(html).toContain('52%');
  expect(html).toContain('aria-label="Checking"');
});
