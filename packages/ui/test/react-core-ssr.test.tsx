// @vitest-environment node

import { useEffect } from 'react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { Slot } from '../src/core/Slot.js';
import { useControllableState } from '../src/core/useControllableState.js';
import { useIsoLayoutEffect } from '../src/core/useIsoLayoutEffect.js';

it('imports and renders the private React core in Node without a DOM', () => {
  const effect = vi.fn();

  function View(): ReactElement {
    const [label] = useControllableState({ defaultValue: 'Server value' });
    useIsoLayoutEffect(effect, []);
    return (
      <Slot className="slot">
        <a href="#details">{label}</a>
      </Slot>
    );
  }

  expect(typeof document).toBe('undefined');
  expect(useIsoLayoutEffect).toBe(useEffect);
  expect(renderToString(<View />)).toBe('<a href="#details" class="slot">Server value</a>');
  expect(effect).not.toHaveBeenCalled();
});
