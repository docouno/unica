import { describe, expect, it } from 'vitest';
import { stepCandidate, stepSize } from '../src/components/NumberInput/step.js';
import type { StepDomain } from '../src/components/NumberInput/step.js';

function domain(
  min?: number,
  max?: number,
  step: StepDomain['step'] = 1,
  base = min ?? 0,
): StepDomain {
  return { min, max, step, base };
}

describe('NumberInput directional steps', () => {
  const cases = [
    ['overflow', 125, domain(0, 50), 50, undefined],
    ['underflow', -5, domain(0, 50), undefined, 0],
    ['off-step', 12, domain(0, 50, 5), 10, 15],
    ['off-step maximum', 12, domain(0, 12, 5), 10, undefined],
    ['negative offset', -0.6, domain(-1, undefined, 0.25), -0.75, -0.5],
    ['decimal tenths', 0.2, domain(0, undefined, 0.1), 0.1, 0.3],
    ['tiny step', 2e-11, domain(0, undefined, 1e-11), 1e-11, 3e-11],
    ['reverse tiny step', 3e-11, domain(0, undefined, 1e-11), 2e-11, 4e-11],
    ['unrestricted fraction', 0.25, domain(undefined, undefined, 'any'), -0.75, 1.25],
    ['unrestricted capped fraction', 0.25, domain(undefined, 0.8, 'any'), -0.75, 0.8],
    ['unrestricted overshoot', 15.25, domain(5, 10, 'any'), 10, undefined],
    ['empty', '', domain(), -1, 1],
    ['empty at zero bound', '', domain(0), 0, 1],
    ['empty positive domain', '', domain(5, 12), 5, 5],
    ['empty negative domain', '', domain(-20, -5, 5), -5, -5],
    ['empty shifted grid', '', domain(undefined, undefined, 5, 2), -3, 2],
    ['empty below shifted grid', '', domain(undefined, 1, 5, 2), -3, -3],
    ['base from value attribute', 5, domain(undefined, undefined, 5, 2), 2, 7],
    ['single value', 5, domain(5, 5), undefined, undefined],
    ['inverted domain', 10, domain(15, 5), undefined, undefined],
    ['unrepresentable next grid point', 9007199254740992, domain(0), 9007199254740991, undefined],
    ['both neighbors unrepresentable', 1e16, domain(0), undefined, undefined],
    ['adjacent subnormals', 5e-324, domain(0, undefined, 5e-324), 0, 1e-323],
    [
      'overflow at finite limit',
      Number.MAX_VALUE,
      domain(undefined, undefined, Number.MAX_VALUE),
      0,
      undefined,
    ],
  ] as const;
  it.each(cases)('%s', (_name, current, limits, down, up) => {
    expect(stepCandidate(current, limits, -1)).toBe(down);
    expect(stepCandidate(current, limits, 1)).toBe(up);
  });

  it.each([undefined, 0, -1, NaN, Infinity])('uses step 1 for %s', (value) => {
    expect(stepSize(value)).toBe(1);
  });
});
