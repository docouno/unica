import { expect, it } from 'vitest';
import { createResetOperation } from '../src/core/forms/NativeResetWitness.js';

function dispatch(isTrusted: boolean) {
  const event = { isTrusted, eventPhase: 2, defaultPrevented: false };
  return { event, operation: createResetOperation(event) };
}

it('requires witness confirmation after dispatch and reads late cancellation', () => {
  const cancelled = dispatch(true);
  expect(cancelled.operation.finish(true)).toBeUndefined();
  cancelled.event.defaultPrevented = true;
  cancelled.event.eventPhase = 0;
  expect(cancelled.operation.finish(true)).toBe('repair');
  expect(cancelled.operation.finish(true)).toBeUndefined();

  const unconfirmed = dispatch(true);
  unconfirmed.event.eventPhase = 0;
  expect(unconfirmed.operation.finish(false)).toBe('repair');
  expect(unconfirmed.operation.finish(true)).toBeUndefined();
});

it('seals synthetic dispatches before late reactions and distinguishes a later trusted reset', () => {
  const synthetic = dispatch(false);
  synthetic.event.eventPhase = 0;
  expect(synthetic.operation.finish(false)).toBe('repair');

  const native = dispatch(true);
  expect(synthetic.operation.finish(true)).toBeUndefined();
  expect(native.operation.finish(true)).toBeUndefined();
  native.event.eventPhase = 0;
  expect(native.operation.finish(true)).toBe('reset');
  expect(native.operation.finish(true)).toBeUndefined();
});

it('repairs a synthetic native action and treats replay of a trusted Event as a new dispatch', () => {
  const synthetic = dispatch(false);
  synthetic.event.eventPhase = 0;
  expect(synthetic.operation.finish(true)).toBe('repair');

  const native = dispatch(true);
  native.event.eventPhase = 0;
  expect(native.operation.finish(true)).toBe('reset');
  native.event.isTrusted = false;
  native.event.eventPhase = 2;
  const replay = createResetOperation(native.event);
  native.event.eventPhase = 0;
  expect(replay.finish(true)).toBe('repair');
  expect(native.operation.finish(true)).toBeUndefined();
});
