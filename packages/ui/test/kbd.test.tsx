import { cleanup, render } from '@testing-library/react';
import { createRef, Fragment } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { Kbd, KbdGroup } from '../src/index.js';

afterEach(cleanup);

describe('Kbd', () => {
  it('forwards native attributes and refs to the keycap', () => {
    const ref = createRef<HTMLElement>();
    const { container } = render(
      <Kbd
        ref={ref}
        id="key"
        className="custom"
        data-shortcut="search"
        lang="fr"
        aria-hidden="true"
        hidden
        size="s"
      >
        Entrée
      </Kbd>,
    );
    const cap = container.querySelector('kbd');
    expect(ref.current).toBe(cap);
    expect(cap?.getAttribute('id')).toBe('key');
    expect(cap?.classList.contains('custom')).toBe(true);
    expect(cap?.getAttribute('data-shortcut')).toBe('search');
    expect(cap?.getAttribute('lang')).toBe('fr');
    expect(cap?.getAttribute('aria-hidden')).toBe('true');
    expect(cap?.hasAttribute('hidden')).toBe(true);
    expect(cap?.getAttribute('data-size')).toBe('s');
    expect(cap?.getAttribute('dir')).toBe('ltr');
    expect(cap?.hasAttribute('tabindex')).toBe(false);
    expect(cap?.hasAttribute('aria-keyshortcuts')).toBe(false);
  });

  it('omits empty content including fragments, but renders zero and arbitrary text', () => {
    const { container, rerender } = render(<Kbd label="Empty" />);
    expect(container.querySelector('kbd')).toBeNull();
    rerender(
      <Kbd label="Empty">
        <>
          {false}
          {true}
          {null}
          {['', undefined]}
        </>
      </Kbd>,
    );
    expect(container.querySelector('kbd')).toBeNull();
    rerender(<Kbd>{0}</Kbd>);
    expect(container.querySelector('kbd')?.textContent).toBe('0');

    for (const name of ['Page Down', 'constructor', 'toString', '__proto__']) {
      rerender(<Kbd>{name}</Kbd>);
      expect(container.querySelector('kbd')?.textContent).toBe(name);
      expect(container.querySelector('svg')).toBeNull();
      expect(container.querySelector('.unica-kbd-face')?.hasAttribute('aria-hidden')).toBe(false);
    }
  });

  it.each([
    ['⌘', 'Command'],
    ['⇧', 'Shift'],
    ['⌥', 'Option'],
    ['⌃', 'Control'],
    ['↵', 'Enter'],
    ['↩', 'Return'],
    ['⌫', 'Backspace'],
    ['⇥', 'Tab'],
    ['↑', 'Arrow up'],
    ['↓', 'Arrow down'],
    ['←', 'Arrow left'],
    ['→', 'Arrow right'],
  ])('gives %s a decorative SVG and the text %s', (symbol, label) => {
    const { container } = render(<Kbd>{symbol}</Kbd>);
    const svg = container.querySelector('kbd svg');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.getAttribute('focusable')).toBe('false');
    expect(svg?.querySelector('path')?.getAttribute('d')).toBeTruthy();
    expect(container.querySelector('kbd > .unica-visually-hidden')?.textContent).toBe(label);
  });

  it('preserves mixed notation when the label is empty and replaces it with one localized label', () => {
    const invalidProps = { 'aria-label': 'A conflicting label' } as unknown as object;
    const { container, rerender } = render(<Kbd label="">⌘K</Kbd>);
    expect(container.querySelector('.unica-visually-hidden')?.textContent).toBe('Command + K');
    expect(container.querySelector('.unica-kbd-face')?.textContent).toBe('K');
    rerender(
      <Kbd {...invalidProps} label="Commande K" lang="fr">
        ⌘K
      </Kbd>,
    );
    expect(container.querySelector('kbd')?.hasAttribute('aria-label')).toBe(false);
    expect(container.querySelector('.unica-kbd-face')?.getAttribute('aria-hidden')).toBe('true');
    expect(
      Array.from(container.querySelectorAll('.unica-visually-hidden'), (node) => node.textContent),
    ).toEqual(['Commande K']);
  });

  it('supports a user-supplied glyph with a spoken label', () => {
    const { container } = render(
      <Kbd label="Globe">
        <svg viewBox="0 0 12 12">
          <circle cx="6" cy="6" r="5" />
        </svg>
      </Kbd>,
    );
    expect(container.querySelector('kbd svg circle')).not.toBeNull();
    expect(container.querySelector('.unica-visually-hidden')?.textContent).toBe('Globe');
    expect(container.querySelector('.unica-kbd-face')?.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('KbdGroup', () => {
  it('skips hidden keys and groups when placing separators and retains the native nodes', () => {
    const keyRef = createRef<HTMLElement>();
    const nestedRef = createRef<HTMLSpanElement>();

    function Shortcut({ hidden }: { readonly hidden: boolean }) {
      return (
        <KbdGroup>
          <Kbd ref={keyRef} hidden={hidden}>
            Ctrl
          </Kbd>
          <Kbd>K</Kbd>
          <Kbd hidden>Alt</Kbd>
          <Kbd>L</Kbd>
          <KbdGroup ref={nestedRef} hidden={hidden}>
            <Kbd>Enter</Kbd>
          </KbdGroup>
        </KbdGroup>
      );
    }

    const { container, rerender } = render(<Shortcut hidden />);
    const hiddenKey = keyRef.current;
    const hiddenGroup = nestedRef.current;
    const stepText = () =>
      Array.from(container.firstElementChild?.children ?? [])
        .filter((child) => !child.hasAttribute('hidden'))
        .map((child) => child.textContent);

    expect(hiddenKey?.hasAttribute('hidden')).toBe(true);
    expect(hiddenGroup?.hasAttribute('hidden')).toBe(true);
    expect(stepText()).toEqual(['K', ' + ', 'L']);

    rerender(<Shortcut hidden={false} />);
    expect(keyRef.current).toBe(hiddenKey);
    expect(nestedRef.current).toBe(hiddenGroup);
    expect(stepText()).toEqual(['Ctrl', ' + ', 'K', ' + ', 'L', ' + ', 'Enter']);
  });

  it('joins present entries through arrays and fragments, retaining a nested chord as one step', () => {
    const ref = createRef<HTMLSpanElement>();
    const { container } = render(
      <KbdGroup ref={ref} id="sequence" className="steps" size="m" separator="then">
        {false}
        {[
          <KbdGroup key="chord">
            <Kbd>Ctrl</Kbd>
            <Kbd>K</Kbd>
          </KbdGroup>,
          '',
          <Fragment key="step">
            {null}
            <Kbd size="s">I</Kbd>
            {true}
          </Fragment>,
        ]}
        {undefined}
      </KbdGroup>,
    );
    expect(ref.current).toBe(container.firstElementChild);
    expect(ref.current?.id).toBe('sequence');
    expect(ref.current?.classList.contains('steps')).toBe(true);
    expect(ref.current?.getAttribute('dir')).toBe('ltr');
    expect(ref.current?.getAttribute('data-size')).toBe('m');
    expect(ref.current?.textContent).toBe('Ctrl + K then I');
    expect(
      Array.from(ref.current?.children ?? [], (node) => [node.tagName, node.textContent]),
    ).toEqual([
      ['SPAN', 'Ctrl + K'],
      ['SPAN', ' then '],
      ['KBD', 'I'],
    ]);
  });

  it('keeps a compact separator available to assistive technology only between keys', () => {
    const { container, rerender } = render(
      <KbdGroup separator="" hidden>
        <Kbd>K</Kbd>
      </KbdGroup>,
    );
    expect(container.firstElementChild?.hasAttribute('hidden')).toBe(true);
    expect(container.querySelector('.unica-visually-hidden')).toBeNull();

    rerender(
      <KbdGroup separator="">
        <Kbd>K</Kbd>
        <Kbd>L</Kbd>
      </KbdGroup>,
    );
    const hiddenSeparator = container.querySelector('.unica-kbd-group > .unica-visually-hidden');
    expect(hiddenSeparator?.textContent).toBe(' plus ');
    expect(hiddenSeparator?.hasAttribute('aria-hidden')).toBe(false);
    expect(container.querySelector('.unica-kbd-separator')).toBeNull();
  });
});
