import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { Tag, TagGroup, defineGlyph } from '../src/index.js';
import type { TagGroupItem, TagGroupProps, TagProps } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

const remove = defineGlyph((props) => (
  <svg {...props} data-testid="remove-glyph" viewBox="0 0 24 24" />
));
const leading = defineGlyph((props) => (
  <svg {...props} data-testid="leading-glyph" viewBox="0 0 24 24" />
));
const item = (id: string, label: string): TagGroupItem => ({
  id,
  label,
  removeLabel: `Remove ${label}`,
});

it('renders one native removal action and keeps the leading glyph and rich label passive', () => {
  const root = createRef<HTMLSpanElement>();
  const button = createRef<HTMLButtonElement>();
  const onRemove = vi.fn();
  const release = 'Release גירסה 2';
  const injected: Record<string, string> = {
    'aria-hidden': 'true',
    'data-preview': 'focus',
    'data-unica-mark-status': 'danger',
  };
  render(
    <Tag
      {...injected}
      ref={root}
      removeRef={button}
      removeLabel={`Remove ${release}`}
      textValue={release}
      onRemove={onRemove}
      status="success"
      iconLeft={leading}
      removeIcon={remove}
      aria-describedby="release-context"
      data-ticket={42}
    >
      Release <bdi dir="rtl">גירסה 2</bdi>
    </Tag>,
  );
  expect(root.current?.nodeName).toBe('SPAN');
  expect(root.current?.tabIndex).toBe(-1);
  expect(root.current?.getAttribute('data-ticket')).toBe('42');
  expect(root.current?.getAttribute('aria-describedby')).toBe('release-context');
  expect(root.current?.hasAttribute('aria-hidden')).toBe(false);
  expect(root.current?.hasAttribute('data-preview')).toBe(false);
  expect(root.current?.getAttribute('data-unica-mark-status')).toBe('success');
  const action = screen.getByRole('button', { name: `Remove ${release}` });
  expect(button.current).toBe(action);
  expect(action.getAttribute('aria-label')).toBe(`Remove ${release}`);
  expect(action.getAttribute('type')).toBe('button');
  expect(action.tabIndex).toBe(0);
  expect(screen.getByTestId('leading-glyph').closest('[aria-hidden="true"]')).not.toBeNull();
  expect(screen.getByTestId('remove-glyph').closest('[aria-hidden="true"]')).not.toBeNull();
  fireEvent.click(screen.getByText('גירסה 2'));
  fireEvent.click(screen.getByTestId('leading-glyph'));
  expect(onRemove).not.toHaveBeenCalled();
  fireEvent.click(action);
  expect(onRemove).toHaveBeenCalledTimes(1);
});

it('keeps refs and focus while loading, restores the remove glyph when disabled, and cleans up refs', () => {
  const onRemove = vi.fn();
  const rootCleanup = vi.fn();
  const removeCleanup = vi.fn();
  const rootRef = vi.fn(() => rootCleanup);
  const removeRef = vi.fn(() => removeCleanup);
  const props = {
    ref: rootRef,
    removeRef,
    removeLabel: 'Remove Release',
    removeIcon: remove,
    onRemove,
    children: 'Release',
  } satisfies TagProps;
  const { rerender, unmount } = render(<Tag {...props} />);
  const action = screen.getByRole<HTMLButtonElement>('button', { name: 'Remove Release' });
  action.focus();
  rerender(<Tag {...props} loading />);
  expect(document.activeElement).toBe(action);
  expect(action.getAttribute('aria-busy')).toBe('true');
  expect(action.getAttribute('aria-disabled')).toBe('true');
  expect(action.disabled).toBe(false);
  expect(action.querySelector('[data-unica-activity-spinner]')).not.toBeNull();
  expect(screen.queryByTestId('remove-glyph')).toBeNull();
  fireEvent.click(action);
  rerender(<Tag {...props} disabled loading />);
  expect(action.disabled).toBe(true);
  expect(action.hasAttribute('aria-busy')).toBe(false);
  expect(screen.getByTestId('remove-glyph')).not.toBeNull();
  fireEvent.click(action);
  expect(onRemove).not.toHaveBeenCalled();
  expect(rootRef).toHaveBeenCalledTimes(1);
  expect(removeRef).toHaveBeenCalledTimes(1);
  unmount();
  expect(rootCleanup).toHaveBeenCalledTimes(1);
  expect(removeCleanup).toHaveBeenCalledTimes(1);
});

it('warns about an invalid label without rendering an unnamed action', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const weaklyTyped = {
    children: <b>Release</b>,
    removeLabel: 'Remove Release',
    onRemove: vi.fn(),
  } as unknown as TagProps;
  const { rerender } = render(<Tag {...weaklyTyped} />);
  expect(screen.queryByRole('button')).toBeNull();
  rerender(
    <Tag removeLabel=" " onRemove={vi.fn()}>
      Release
    </Tag>,
  );
  expect(screen.queryByRole('button')).toBeNull();
  expect(warn).toHaveBeenCalled();
});

it('counts the first valid occurrence of each ID and announces only committed removals', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  const onRemove = vi.fn();
  const removed = vi.fn((labels: readonly string[]) => `Removed ${labels.join(' & ')}`);
  const first = item('first', 'Release');
  const second = { ...item('second', 'Checklist'), textValue: 'Full review checklist' };
  const invalid = { ...item('first', 'Never rendered'), removeLabel: '' };
  const props = { 'aria-label': 'Labels', messages: { removed }, onRemove, maxVisible: 1 };
  const { rerender } = render(
    <TagGroup {...props} items={[invalid, first, second, item('first', 'Duplicate')]} />,
  );
  const group = screen.getByRole('toolbar', { name: 'Labels' });
  expect(within(group).getByRole('button', { name: '+1 more value' })).not.toBeNull();
  expect(within(group).queryByText('Duplicate')).toBeNull();
  expect(warn).toHaveBeenCalled();
  const live = within(group).getByRole('status');
  expect(live.textContent).toBe('');
  fireEvent.click(within(group).getByRole('button', { name: 'Remove Release' }));
  expect(onRemove.mock.calls).toEqual([['first']]);
  expect(within(group).getByRole('button', { name: 'Remove Release' })).not.toBeNull();
  expect(removed).not.toHaveBeenCalled();
  rerender(<TagGroup {...props} items={[first]} />);
  expect(removed.mock.calls).toEqual([[['Full review checklist']]]);
  expect(live.textContent).toBe('Removed Full review checklist');
  rerender(<TagGroup {...props} items={[item('first', 'Release v2')]} />);
  expect(removed).toHaveBeenCalledTimes(1);
  expect(within(group).getByRole('status')).toBe(live);
});

it('keeps consumer item metadata out of the rendered value and its tab stop', () => {
  const imported = {
    ...item('first', 'Release'),
    hidden: true,
    inert: true,
    'aria-hidden': true,
    'aria-describedby': 'service-metadata',
  };
  render(
    <TagGroup
      aria-label="Assigned"
      items={[imported, item('second', 'Checklist')]}
      onRemove={vi.fn()}
    />,
  );
  const action = screen.getByRole<HTMLButtonElement>('button', { name: 'Remove Release' });
  const tag = action.parentElement;
  expect(tag?.textContent).toContain('Release');
  for (const attribute of ['hidden', 'inert', 'aria-hidden', 'aria-describedby']) {
    expect(tag?.hasAttribute(attribute)).toBe(false);
  }
  expect(action.tabIndex).toBe(0);
  expect(screen.getByRole('button', { name: 'Remove Checklist' }).tabIndex).toBe(-1);
});

it('reserves toolbar semantics and keeps disclosure available when removal is disabled', () => {
  const toolbar = {
    'aria-disabled': true,
    'aria-hidden': true,
    'aria-orientation': 'vertical',
  } as unknown as TagGroupProps;
  render(
    <TagGroup
      {...toolbar}
      aria-label="Assigned"
      items={[item('first', 'Release'), item('second', 'Checklist')]}
      maxVisible={1}
      disabled
      onRemove={vi.fn()}
    />,
  );
  const group = screen.getByRole('toolbar', { name: 'Assigned' });
  expect(group.hasAttribute('aria-orientation')).toBe(false);
  expect(group.hasAttribute('aria-disabled')).toBe(false);
  expect(group.hasAttribute('aria-hidden')).toBe(false);
  const disclosure = within(group).getByRole('button', { name: '+1 more value' });
  expect(disclosure.textContent).toBe('+1 more');
  expect(disclosure.tabIndex).toBe(0);
  fireEvent.click(disclosure);
  const collapse = within(group).getByRole('button', { name: 'Show less' });
  expect(collapse).toBe(disclosure);
  expect(collapse.textContent).toBe('Show less');
});
