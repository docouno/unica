import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { StrictMode, useCallback, useRef, useState } from 'react';
import type { FocusEvent, JSX, KeyboardEvent, RefCallback } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useActiveDescendant } from '../src/core/collections/useActiveDescendant.js';
import { useRovingFocus } from '../src/core/collections/useRovingFocus.js';

afterEach(cleanup);

describe('collection hooks (jsdom)', () => {
  it('keeps merged refs, composed focus handlers, and container callbacks referentially stable across rerenders under StrictMode', () => {
    const seenRefs: RefCallback<HTMLButtonElement>[] = [];
    const seenFocus: ((event: FocusEvent<HTMLButtonElement>) => void)[] = [];
    const seenKeyDown: ((event: KeyboardEvent<HTMLElement>) => void)[] = [];
    const seenBlur: ((event: FocusEvent<HTMLElement>) => void)[] = [];
    const userRefMounts = vi.fn();
    const userRefUnmounts = vi.fn();

    function StableList({ tick }: { tick: number }): JSX.Element {
      void tick;
      const stableUserRef = useCallback((node: HTMLButtonElement | null) => {
        if (!node) {
          return;
        }
        userRefMounts();
        return () => {
          userRefUnmounts();
        };
      }, []);
      const stableUserFocus = useCallback(() => undefined, []);
      const roving = useRovingFocus<HTMLButtonElement>({
        items: [
          { key: 'a', label: 'Alpha' },
          { key: 'b', label: 'Beta' },
        ],
        orientation: 'horizontal',
        wrap: true,
        typeahead: false,
      });
      const itemA = roving.getItemProps('a', { ref: stableUserRef, onFocus: stableUserFocus });
      seenRefs.push(itemA.ref);
      seenFocus.push(itemA.onFocus);
      seenKeyDown.push(roving.onKeyDown);
      seenBlur.push(roving.onBlur);

      return (
        <div role="tablist" onKeyDown={roving.onKeyDown} onBlur={roving.onBlur}>
          <button type="button" {...itemA}>
            A
          </button>
          <button type="button" {...roving.getItemProps('b')}>
            B
          </button>
        </div>
      );
    }

    const { rerender, unmount } = render(
      <StrictMode>
        <StableList tick={0} />
      </StrictMode>,
    );
    const mountsAfterInitial = userRefMounts.mock.calls.length;
    const unmountsAfterInitial = userRefUnmounts.mock.calls.length;

    rerender(
      <StrictMode>
        <StableList tick={1} />
      </StrictMode>,
    );
    rerender(
      <StrictMode>
        <StableList tick={2} />
      </StrictMode>,
    );

    expect(new Set(seenRefs).size).toBe(1);
    expect(new Set(seenFocus).size).toBe(1);
    expect(new Set(seenKeyDown).size).toBe(1);
    expect(new Set(seenBlur).size).toBe(1);
    // Rerenders must cause zero extra ref detach/reattach cycles even after StrictMode mount checks.
    expect(userRefMounts).toHaveBeenCalledTimes(mountsAfterInitial);
    expect(userRefUnmounts).toHaveBeenCalledTimes(unmountsAfterInitial);

    unmount();
    expect(userRefUnmounts).toHaveBeenCalledTimes(unmountsAfterInitial + 1);
  });

  it('publishes new items before child autoFocus runs (useInsertionEffect)', () => {
    function DynamicAutoFocus(): JSX.Element {
      const [items, setItems] = useState(['a', 'b']);
      const roving = useRovingFocus<HTMLButtonElement>({
        items: items.map((key) => ({ key, label: key })),
        entryKey: 'a',
        orientation: 'horizontal',
        wrap: false,
        typeahead: false,
      });
      return (
        <>
          <div role="tablist" onKeyDown={roving.onKeyDown} onBlur={roving.onBlur}>
            {items.map((item) => (
              <button
                key={item}
                role="tab"
                type="button"
                autoFocus={item === 'c'}
                {...roving.getItemProps(item)}
              >
                {item}
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setItems(['a', 'b', 'c'])}>
            Add C
          </button>
          <output data-testid="tabstop">{roving.tabStop ?? ''}</output>
        </>
      );
    }

    render(<DynamicAutoFocus />);
    fireEvent.click(screen.getByText('Add C'));
    const tabC = screen.getByRole('tab', { name: 'c' });
    expect(document.activeElement).toBe(tabC);
    expect(screen.getByTestId('tabstop').textContent).toBe('c');
    expect(tabC.getAttribute('tabindex')).toBe('0');
  });

  it('survives DOM clobbering of contains and nodeType on a <form> roving container and non-Node relatedTarget', () => {
    let blurHandler: ((event: FocusEvent<HTMLElement>) => void) | null = null;
    let formEl: HTMLFormElement | null = null;

    function ClobberedFormList(): JSX.Element {
      const roving = useRovingFocus<HTMLButtonElement>({
        items: [
          { key: 'a', label: 'A' },
          { key: 'b', label: 'B' },
        ],
        orientation: 'horizontal',
        wrap: false,
        typeahead: false,
      });
      blurHandler = roving.onBlur;
      return (
        <form
          ref={(node) => {
            formEl = node;
          }}
          role="tablist"
          tabIndex={-1}
          onKeyDown={roving.onKeyDown}
          onBlur={roving.onBlur}
        >
          <input name="contains" aria-label="Clobber contains" />
          <input name="nodeType" aria-label="Clobber nodeType" />
          <button type="button" role="tab" {...roving.getItemProps('a')}>
            A
          </button>
          <button type="button" role="tab" {...roving.getItemProps('b')}>
            B
          </button>
        </form>
      );
    }

    render(<ClobberedFormList />);
    const tabA = screen.getByRole('tab', { name: 'A' });
    const tabB = screen.getByRole('tab', { name: 'B' });

    // Focus non-default tabB and blur toward tabA: containsSafe must genuinely return true and keep focusedKey='b'.
    act(() => {
      tabB.focus();
    });
    expect(tabB.getAttribute('tabindex')).toBe('0');
    fireEvent.blur(tabB, { relatedTarget: tabA });
    expect(tabB.getAttribute('tabindex')).toBe('0');

    // Focusing the clobbered <form> container and pressing ArrowRight exercises isElementNode(event.target).
    act(() => {
      formEl!.focus();
    });
    fireEvent.keyDown(formEl!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(tabA);

    // Non-Node relatedTarget (for example Window or custom EventTarget) must not throw in roving.onBlur.
    expect(() =>
      act(() =>
        blurHandler!({
          currentTarget: formEl!,
          relatedTarget: window,
        } as unknown as FocusEvent<HTMLElement>),
      ),
    ).not.toThrow();
  });

  it('does not permanently desync useActiveDescendant when onActiveChange rejects or throws', async () => {
    const proposals: string[] = [];
    let shouldThrow = false;
    let keyDownHandler: ((event: KeyboardEvent<HTMLElement>) => void) | null = null;

    function ControlledActive(): JSX.Element {
      const inputRef = useRef<HTMLInputElement>(null);
      const virtual = useActiveDescendant({
        items: [
          { key: 'a', id: 'opt-a', label: 'Alpha' },
          { key: 'b', id: 'opt-b', label: 'Beta' },
          { key: 'c', id: 'opt-c', label: 'Gamma' },
        ],
        activeKey: 'a',
        open: true,
        orientation: 'vertical',
        wrap: false,
        typeahead: false,
        onActiveChange: (key) => {
          proposals.push(key);
          if (shouldThrow) {
            shouldThrow = false;
            throw new Error('rejected by throw');
          }
        },
      });
      keyDownHandler = virtual.onKeyDown;
      return (
        <input
          ref={inputRef}
          role="combobox"
          aria-label="Controlled combobox"
          aria-activedescendant={virtual['aria-activedescendant']}
          onKeyDown={virtual.onKeyDown}
          onBlur={virtual.onBlur}
        />
      );
    }

    render(<ControlledActive />);
    const input = screen.getByRole('combobox', { name: 'Controlled combobox' });

    // 1. Rejected proposal (owner keeps activeKey='a'): after microtask, next ArrowDown still proposes 'b', not 'c'.
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await act(async () => {
      await Promise.resolve();
    });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    await act(async () => {
      await Promise.resolve();
    });
    expect(proposals).toEqual(['b', 'b']);

    // 2. Throwing onActiveChange rolls back immediately even within the same synchronous tick.
    const makeArrowDown = (): KeyboardEvent<HTMLElement> =>
      ({
        defaultPrevented: false,
        currentTarget: input,
        nativeEvent: new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }),
        preventDefault: () => undefined,
      }) as unknown as KeyboardEvent<HTMLElement>;

    shouldThrow = true;
    expect(() => keyDownHandler!(makeArrowDown())).toThrow('rejected by throw');
    keyDownHandler!(makeArrowDown());
    expect(proposals).toEqual(['b', 'b', 'b', 'b']);
  });
});
