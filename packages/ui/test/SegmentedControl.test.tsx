import { cleanup, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { SegmentedControl } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

it('forwards the root ref and attributes and initially selects the first available option', () => {
  const ref = createRef<HTMLDivElement>();
  render(
    <>
      <span id="layout-label">Layout</span>
      <SegmentedControl
        ref={ref}
        aria-labelledby="layout-label"
        className="preferences-layout"
        data-section="display"
        items={[
          { value: 'columns', label: 'Columns', disabled: true },
          { value: '', label: 'Auto' },
        ]}
      />
    </>,
  );

  const group = screen.getByRole('radiogroup', { name: 'Layout' });
  expect(ref.current).toBe(group);
  expect(group.classList.contains('preferences-layout')).toBe(true);
  expect(group.dataset.section).toBe('display');
  expect(screen.getByRole('radio', { checked: true }).getAttribute('value')).toBe('');
});

it('keeps item state attributes off the root when received from an untyped caller', () => {
  const attributes = { 'aria-checked': 'true', 'aria-selected': 'true' };
  render(
    // @ts-expect-error These attributes belong to the component.
    <SegmentedControl aria-label="Layout" items={[]} {...attributes} />,
  );
  const group = screen.getByRole('radiogroup', { name: 'Layout' });
  expect(group.getAttribute('aria-checked')).toBeNull();
  expect(group.getAttribute('aria-selected')).toBeNull();
});

it('keeps the first option for a duplicated key and warns once', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const items = [
    { value: 'grid', label: 'Grid' },
    { value: 'grid', label: 'Duplicate' },
  ];
  const { rerender } = render(<SegmentedControl aria-label="Layout" items={items} />);
  rerender(<SegmentedControl aria-label="Layout" items={[...items]} />);
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  expect(screen.getByRole('radio', { name: 'Grid', checked: true })).toBeTruthy();
  expect(warn).toHaveBeenCalledTimes(1);
});
