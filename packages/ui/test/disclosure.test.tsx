import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Button,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../src/index.js';

afterEach(cleanup);

it('renders stable SSR relationships and strips other native button commands', () => {
  const unsafe = {
    type: 'submit',
    TYPE: 'submit',
    command: 'show-modal',
    commandFor: 'other',
    commandfor: 'other',
    popoverTarget: 'other',
    popoverTargetAction: 'show',
    popovertarget: 'other',
    popovertargetaction: 'show',
    'ARIA-EXPANDED': 'true',
    'ARIA-CONTROLS': 'other',
    'DATA-UNICA-DISCLOSURE-INDICATOR': 'invalid',
    'aria-pressed': 'true',
  } as unknown as Record<string, never>;
  const rawPanel = { ID: 'other', HIDDEN: '', INERT: '', 'data-testid': 'panel' };
  const html = renderToString(
    <form>
      <Collapsible contentId="details" lazyMount>
        <CollapsibleTrigger {...unsafe}>First</CollapsibleTrigger>
        <CollapsibleTrigger asChild>
          <Button {...unsafe}>Second</Button>
        </CollapsibleTrigger>
        <CollapsibleContent {...rawPanel} style={{ display: 'grid' }}>
          Lazy body
        </CollapsibleContent>
      </Collapsible>
      <Accordion headingLevel={4} defaultValue={['a']} exclusive>
        <AccordionItem value="a">
          <AccordionContent {...rawPanel} role="region">
            Named region
          </AccordionContent>
          <AccordionTrigger {...unsafe} action={<button type="button">Copy</button>}>
            Section
          </AccordionTrigger>
        </AccordionItem>
        <AccordionItem value="b">
          <AccordionTrigger>Other section</AccordionTrigger>
          <AccordionContent role="region" aria-label="Custom name">
            Other region
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </form>,
  );
  const root = new DOMParser().parseFromString(html, 'text/html');
  const controls = [...root.querySelectorAll<HTMLButtonElement>('button[aria-controls]')];
  expect(controls).toHaveLength(4);
  expect(controls.map((node) => node.getAttribute('aria-expanded'))).toEqual([
    'false',
    'false',
    'true',
    'false',
  ]);
  for (const button of controls) {
    expect(button.type).toBe('button');
    expect(
      button.matches(
        '[aria-pressed], [command], [commandfor], [popovertarget], [popovertargetaction]',
      ),
    ).toBe(false);
    expect(root.getElementById(button.getAttribute('aria-controls')!)).not.toBeNull();
  }
  expect(controls[2]!.getAttribute('data-unica-disclosure-indicator')).toBe('end');
  expect(controls.slice(0, 2).map((node) => node.getAttribute('aria-controls'))).toEqual([
    'details',
    'details',
  ]);
  expect(root.getElementById('details')!.matches('[hidden][inert]')).toBe(true);
  expect(root.getElementById('details')!.textContent).toBe('');
  expect(root.getElementById('details')!.style.display).toBe('none');
  expect(root.querySelector('[role="region"]')!.matches('[hidden], [inert]')).toBe(false);
  expect(root.querySelector('[role="region"]')!.getAttribute('aria-labelledby')).toBe(
    controls[2]!.id,
  );
  expect(root.querySelector('[aria-label="Custom name"]')!.hasAttribute('aria-labelledby')).toBe(
    false,
  );
  expect(root.querySelector('h4')!.children).toHaveLength(1);
  expect(root.querySelector('h4')!.nextElementSibling!.textContent).toBe('Copy');
});

it.each(['pressed', 'defaultPressed', 'onPressedChange'] as const)(
  'rejects a delegated toggle Button with %s',
  (key) => {
    const toggle = { [key]: key === 'onPressedChange' ? vi.fn() : false };
    expect(() =>
      renderToString(
        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button {...toggle}>Invalid</Button>
          </CollapsibleTrigger>
        </Collapsible>,
      ),
    ).toThrow(/without pressed, defaultPressed, or onPressedChange/);
  },
);

it('rejects toggle state supplied by the trigger wrapper to a delegated Button', () => {
  const toggle = {
    defaultPressed: false,
    onPressedChange: vi.fn(),
  } as unknown as Record<string, never>;
  expect(() =>
    renderToString(
      <Collapsible open={false}>
        <CollapsibleTrigger {...toggle} asChild>
          <Button>Details</Button>
        </CollapsibleTrigger>
      </Collapsible>,
    ),
  ).toThrow(/without pressed, defaultPressed, or onPressedChange/);
});

it('keeps delegated handlers, merged refs and controlled authority', () => {
  const calls: string[] = [];
  const child = createRef<HTMLButtonElement>();
  const trigger = createRef<HTMLButtonElement>();
  const panel = createRef<HTMLDivElement>();
  const onOpenChange = vi.fn((open: boolean) => calls.push(String(open)));
  function example(open: boolean, cancel = false) {
    return (
      <Collapsible open={open} onOpenChange={onOpenChange}>
        <CollapsibleTrigger asChild ref={trigger} onClick={() => calls.push('outer')}>
          <button
            ref={child}
            onClick={(event) => {
              calls.push('child');
              if (cancel) {
                event.preventDefault();
              }
            }}
          >
            Details
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent ref={panel}>
          <input aria-label="Draft" defaultValue="original" />
        </CollapsibleContent>
      </Collapsible>
    );
  }
  const { rerender } = render(example(false, true));
  const button = screen.getByRole('button', { name: 'Details' });
  expect(child.current).toBe(button);
  expect(trigger.current).toBe(button);
  fireEvent.click(button);
  expect(calls).toEqual(['child']);
  rerender(example(false));
  fireEvent.click(button);
  expect(calls).toEqual(['child', 'child', 'outer', 'true']);
  expect(panel.current!.hidden).toBe(true);
  rerender(example(true));
  expect(panel.current!.hidden).toBe(false);
  expect(onOpenChange).toHaveBeenCalledTimes(1);
});

it('keeps unknown keys and mounted drafts through reordering and restores returned items open', () => {
  const changed = vi.fn();
  function example(keys: string[]) {
    return (
      <Accordion headingLevel={2} defaultValue={['missing', 'a', 'a', 'b']} onValueChange={changed}>
        {keys.map((key) => (
          <AccordionItem key={key} value={key}>
            <AccordionTrigger>{key}</AccordionTrigger>
            <AccordionContent>
              <input aria-label={key + ' draft'} defaultValue={key} />
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
  const { rerender } = render(example(['a', 'b', 'c']));
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: 'a draft' });
  const button = screen.getByRole('button', { name: 'a' });
  const panelId = button.getAttribute('aria-controls');
  fireEvent.change(input, { target: { value: 'edited' } });
  rerender(example(['b', 'a', 'c']));
  expect(screen.getByRole('textbox', { name: 'a draft' })).toBe(input);
  expect(input.value).toBe('edited');
  expect(button.getAttribute('aria-controls')).toBe(panelId);
  fireEvent.click(screen.getByRole('button', { name: 'c' }));
  expect(changed).toHaveBeenLastCalledWith(['missing', 'a', 'b', 'c']);
  rerender(example(['b', 'c']));
  rerender(example(['a', 'b', 'c']));
  expect(screen.getByRole<HTMLInputElement>('textbox', { name: 'a draft' }).value).toBe('a');
});

it('lets an exclusive heading replace a disabled open section and close again', () => {
  const changed = vi.fn();
  render(
    <Accordion headingLevel={2} defaultValue={['a', 'b']} exclusive onValueChange={changed}>
      <AccordionItem value="a" disabled>
        <AccordionTrigger action={<Button>Copy</Button>}>First</AccordionTrigger>
        <AccordionContent>
          <input aria-label="Available field" />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="b">
        <AccordionTrigger>Second</AccordionTrigger>
        <AccordionContent>Second body</AccordionContent>
      </AccordionItem>
    </Accordion>,
  );
  expect(screen.getByRole<HTMLInputElement>('textbox').disabled).toBe(false);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Copy' }).disabled).toBe(false);
  const second = screen.getByRole('button', { name: 'Second' });
  fireEvent.click(second);
  expect(changed).toHaveBeenLastCalledWith(['b']);
  fireEvent.click(second);
  expect(changed).toHaveBeenLastCalledWith([]);
});
