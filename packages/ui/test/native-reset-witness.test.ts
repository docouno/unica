import { expect, it } from 'vitest';
import { createResetOperation } from '../src/core/forms/NativeResetWitness.js';

function dispatch(isTrusted: boolean) {
  const event = { isTrusted, eventPhase: 2, defaultPrevented: false };
  return { event, operation: createResetOperation(event) };
}

it('waits until dispatch completes and reads late cancellation', () => {
  const cancelled = dispatch(true);
  expect(cancelled.operation.finish()).toBeUndefined();
  cancelled.event.defaultPrevented = true;
  cancelled.event.eventPhase = 0;
  expect(cancelled.operation.finish()).toBe('repair');
  expect(cancelled.operation.finish()).toBeUndefined();
});

it('seals synthetic dispatches and distinguishes a later trusted reset', () => {
  const synthetic = dispatch(false);
  synthetic.event.eventPhase = 0;
  expect(synthetic.operation.finish()).toBe('repair');
  expect(synthetic.operation.finish()).toBeUndefined();

  const native = dispatch(true);
  expect(native.operation.finish()).toBeUndefined();
  native.event.eventPhase = 0;
  expect(native.operation.finish()).toBe('reset');
  expect(native.operation.finish()).toBeUndefined();
});

it('treats replay of a trusted Event as a new untrusted dispatch', () => {
  const native = dispatch(true);
  native.event.eventPhase = 0;
  expect(native.operation.finish()).toBe('reset');
  native.event.isTrusted = false;
  native.event.eventPhase = 2;
  const replay = createResetOperation(native.event);
  native.event.eventPhase = 0;
  expect(replay.finish()).toBe('repair');
  expect(native.operation.finish()).toBeUndefined();
});
