import { expect, it } from 'vitest';
import { registerOverlay } from '../src/core/overlay/runtime.js';

interface FocusTargets {
  readonly trigger: HTMLElement | null;
  previousFocus: WeakRef<Element> | null;
  phase: 'closed' | 'open';
}

it('exposes the anchor while open without retaining closed focus targets in the shared runtime', () => {
  const trigger = document.createElement('button');
  const carrier = document.createElement('span');
  const handle = registerOverlay({
    kind: 'manual',
    element: carrier,
    trigger,
    returnFocus: false,
    onOpenChange: () => {},
  });
  const layer = handle as typeof handle & FocusTargets;
  try {
    layer.phase = 'open';
    layer.previousFocus = new WeakRef(trigger);
    expect(layer.trigger).toBe(trigger);
    expect(layer.previousFocus).toBeNull();
    layer.phase = 'closed';
    expect(layer.trigger).toBeNull();
  } finally {
    handle.dispose();
  }
});
