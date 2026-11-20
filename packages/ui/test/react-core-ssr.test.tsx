// @vitest-environment node

import { useEffect, useRef } from 'react';
import type { ReactElement } from 'react';
import { renderToString } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useActiveDescendant } from '../src/core/collections/useActiveDescendant.js';
import { useRovingFocus } from '../src/core/collections/useRovingFocus.js';
import { FormInput, FormSelect, FormTextarea } from '../src/core/forms/carriers.js';
import { useFormValue } from '../src/core/forms/useFormValue.js';
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

it('renders form carriers and collection hooks in Node SSR without DOM globals or inline styles', () => {
  function ServerSurface(): ReactElement {
    const input = useRef<HTMLInputElement>(null);
    const select = useRef<HTMLSelectElement>(null);
    const field = useFormValue<string>({
      defaultValue: 'hello',
      getControl: () => input.current,
      write: () => undefined,
    });
    const roving = useRovingFocus<HTMLButtonElement>({
      items: [
        { key: 'a', label: 'Alpha' },
        { key: 'b', label: 'Beta' },
      ],
      entryKey: 'b',
      orientation: 'horizontal',
      wrap: true,
      typeahead: false,
    });
    const virtual = useActiveDescendant({
      items: [{ key: 'a', id: 'opt-a', label: 'Alpha' }],
      activeKey: 'a',
      orientation: 'vertical',
      wrap: false,
      typeahead: false,
      open: true,
      onActiveChange: () => undefined,
    });
    return (
      <form>
        <FormInput ref={input} name="text" defaultValue={field.value} />
        <FormTextarea name="notes" defaultValue="note" />
        <FormSelect ref={select} name="choice" initialValue={null} getFocusTarget={() => null} />
        <div role="tablist" onKeyDown={roving.onKeyDown} onBlur={roving.onBlur}>
          <button type="button" {...roving.getItemProps('a')}>
            A
          </button>
          <button type="button" {...roving.getItemProps('b')}>
            B
          </button>
        </div>
        <input role="combobox" aria-activedescendant={virtual['aria-activedescendant']} />
      </form>
    );
  }

  const html = renderToString(<ServerSurface />);
  expect(html).toContain('class="unica-visually-hidden"');
  expect(html).not.toContain('style=');
  expect(html).toContain('aria-activedescendant="opt-a"');
  expect(html).toContain('tabindex="0">B</button>');
});
