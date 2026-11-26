import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, StrictMode, useState } from 'react';
import type { MouseEvent } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import {
  Listbox,
  ListboxGroup,
  ListboxOption,
  Select,
  SelectContent,
  SelectGroup,
  SelectOption,
  SelectTrigger,
} from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

it('renders the same ordered, named choices from data and nested fragments', () => {
  const dataRef = createRef<HTMLDivElement>();
  const optionRef = createRef<HTMLDivElement>();
  const groupRef = createRef<HTMLDivElement>();
  const choices = [
    { label: 'Team', options: [{ value: 'a', label: 'Alpha', description: 'Primary reviewer' }] },
    { label: 'Team', options: [{ value: '', label: 'Empty key', disabled: true }] },
  ];
  const { unmount } = render(
    <StrictMode>
      <Listbox
        aria-label="Data"
        ref={dataRef}
        options={choices}
        multiple
        defaultValue={['', 'a', '']}
      />
      <Listbox aria-label="Markup" multiple defaultValue={['', 'a', '']}>
        {false}
        <>
          <ListboxGroup label="Team" ref={groupRef}>
            <ListboxOption value="a" label="Alpha" description="Primary reviewer" ref={optionRef} />
          </ListboxGroup>
          <ListboxGroup label="Team">
            <>
              <ListboxOption value="" label="Empty key" disabled />
            </>
          </ListboxGroup>
        </>
      </Listbox>
    </StrictMode>,
  );
  const data = screen.getByRole('listbox', { name: 'Data' });
  const markup = screen.getByRole('listbox', { name: 'Markup' });
  const dataAlpha = within(data).getByRole('option', {
    name: 'Alpha',
    description: 'Primary reviewer',
  });
  const markupAlpha = within(markup).getByRole('option', {
    name: 'Alpha',
    description: 'Primary reviewer',
  });
  for (const choices of [data, markup]) {
    expect(within(choices).getAllByRole('group', { name: 'Team' })).toHaveLength(2);
    expect(within(choices).getAllByRole('option', { selected: true })).toHaveLength(2);
    expect(
      within(choices).getByRole('option', { name: 'Empty key' }).getAttribute('aria-disabled'),
    ).toBe('true');
  }
  expect(dataRef.current).toBe(data);
  expect(optionRef.current).toBe(markupAlpha);
  expect(groupRef.current).toBe(markupAlpha.closest('[role=group]'));
  expect(dataAlpha.id).not.toBe(markupAlpha.id);
  expect(dataAlpha.getAttribute('aria-labelledby')).not.toBe(
    markupAlpha.getAttribute('aria-labelledby'),
  );
  unmount();
  expect(dataRef.current).toBeNull();
  expect(optionRef.current).toBeNull();
  expect(groupRef.current).toBeNull();
});

it('keeps the first row for a duplicated key and commits only unique multiple answers', () => {
  const warned = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const changed = vi.fn();
  const options = [
    { value: '', label: 'First empty key' },
    { label: 'Team', options: [{ value: '', label: 'Duplicate empty key' }] },
    { value: '__proto__', label: 'Other choice' },
  ];
  const { rerender } = render(
    <Listbox
      aria-label="Choices"
      options={options}
      multiple
      defaultValue={['', '']}
      onValueChange={changed}
    />,
  );
  rerender(
    <Listbox
      aria-label="Choices"
      options={[...options]}
      multiple
      defaultValue={['', '']}
      onValueChange={changed}
    />,
  );
  expect(warned).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('option')).toHaveLength(2);
  expect(screen.getByRole('option', { name: 'First empty key', selected: true })).toBeTruthy();
  fireEvent.click(screen.getByRole('option', { name: 'Other choice' }));
  expect(changed).toHaveBeenLastCalledWith(['', '__proto__']);
});

it('preserves the visible root and trigger refs and applies root name precedence', () => {
  const rootRef = createRef<HTMLButtonElement>();
  const triggerRef = createRef<HTMLButtonElement>();
  const contentRef = createRef<HTMLDivElement>();
  const openChanged = vi.fn();
  const clicked = vi.fn();
  const triggerClicked = vi.fn((event: MouseEvent<HTMLButtonElement>) => event.preventDefault());
  const { unmount } = render(
    <StrictMode>
      <Select
        ref={rootRef}
        id="roles"
        aria-label="Roles"
        onClick={clicked}
        onOpenChange={openChanged}
      >
        <SelectTrigger
          ref={triggerRef}
          id="alternate"
          aria-label="Alternate"
          onClick={triggerClicked}
        />
        <SelectContent ref={contentRef}>
          <SelectGroup label="Team">
            <SelectOption value="a" label="Alpha" />
          </SelectGroup>
        </SelectContent>
      </Select>
    </StrictMode>,
  );
  const trigger = screen.getByRole('button', { name: 'Roles' });
  expect(rootRef.current).toBe(trigger);
  expect(triggerRef.current).toBe(trigger);
  expect(trigger.id).toBe('roles');
  expect(contentRef.current?.getAttribute('popover')).toBe('auto');
  fireEvent.click(trigger);
  expect(triggerClicked).toHaveBeenCalledTimes(1);
  expect(clicked).toHaveBeenCalledTimes(1);
  expect(openChanged).not.toHaveBeenCalled();
  unmount();
  expect(rootRef.current).toBeNull();
  expect(triggerRef.current).toBeNull();
  expect(contentRef.current).toBeNull();
});

it('resolves the committed label, remembered label and safe selected-label lookup', () => {
  const options = [{ value: 'a', label: 'Catalog label' }];
  const { rerender } = render(
    <Select
      aria-label="Current"
      options={options}
      value="a"
      selectedLabels={{ a: 'Server label' }}
    />,
  );
  const trigger = screen.getByRole('button', { name: 'Current' });
  expect(trigger.title).toBe('Catalog label');
  rerender(
    <Select aria-label="Current" options={[]} value="a" selectedLabels={{ a: 'Server label' }} />,
  );
  expect(trigger.title).toBe('Catalog label');
  rerender(<Select aria-label="Current" options={[]} value="__proto__" selectedLabels={{}} />);
  expect(trigger.title).toBe('Unavailable option');

  const markup = renderToString(
    <Select
      aria-label="From server"
      options={[]}
      multiple
      value={['__proto__', '']}
      selectedLabels={{ ['__proto__']: 'First cold label', '': 'Second cold label' }}
    />,
  );
  const container = document.createElement('div');
  container.innerHTML = markup;
  expect(within(container).getByRole('button', { name: 'From server' }).title).toBe(
    'First cold label, Second cold label',
  );
});

it('keeps the root field name and lets explicit Content references name the dialog', () => {
  const content = createRef<HTMLDivElement>();
  render(
    <>
      <span id="other-trigger-label">Part label</span>
      <span id="picker-panel-label">Panel label</span>
      <Select aria-label="Root field" options={[]} searchable>
        <SelectTrigger aria-labelledby="other-trigger-label" />
        <SelectContent
          ref={content}
          aria-label="Panel fallback"
          aria-labelledby="picker-panel-label"
        >
          {false}
        </SelectContent>
      </Select>
    </>,
  );
  const trigger = screen.getByRole('button', { name: 'Root field' });
  expect(trigger.getAttribute('aria-labelledby')).toBeNull();
  expect(content.current?.getAttribute('aria-labelledby')).toBe('picker-panel-label');
  expect(content.current?.getAttribute('aria-label')).toBe('Panel fallback');
});

it('keeps option keys distinct from data and declarative group identities during replacement', () => {
  const warn = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { rerender } = render(
    <Listbox
      aria-label="Choices"
      options={[
        { label: 'First group', options: [{ value: 'a', label: 'Grouped choice' }] },
        { value: 'group:0', label: 'Standalone choice' },
      ]}
    />,
  );
  rerender(<Listbox aria-label="Choices" options={[{ value: 'b', label: 'Replacement' }]} />);
  expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
    'Replacement',
  ]);

  rerender(
    <Listbox key="compound" aria-label="Choices" defaultValue="missing">
      <>
        {[
          <ListboxGroup key="unavailable" label="Authored">
            <ListboxOption value="a" label="First" />
          </ListboxGroup>,
        ]}
        {[
          <ListboxGroup key="unavailable" label="Another">
            <ListboxOption value="b" label="Second" />
          </ListboxGroup>,
        ]}
      </>
    </Listbox>,
  );
  expect(screen.getAllByRole('group')).toHaveLength(3);
  expect(warn).not.toHaveBeenCalled();
});

it('retains the label when a controlled owner accepts a choice and replaces the catalog together', () => {
  function Owner() {
    const [value, setValue] = useState<string | null>(null);
    return (
      <form aria-label="Editor">
        <Listbox
          aria-label="Role"
          name="role"
          value={value}
          options={value === null ? [{ value: 'a', label: 'Analyst' }] : []}
          onValueChange={setValue}
        />
      </form>
    );
  }

  render(<Owner />);
  fireEvent.click(screen.getByRole('option', { name: 'Analyst' }));
  const group = screen.getByRole('group', { name: 'Unavailable selection' });
  expect(within(group).getByRole('option', { name: 'Analyst', selected: true })).toBeTruthy();
  const form = screen.getByRole<HTMLFormElement>('form', { name: 'Editor' });
  expect(new FormData(form).get('role')).toBe('a');
});
