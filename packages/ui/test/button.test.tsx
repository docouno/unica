import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef, Fragment } from 'react';
import type { ComponentPropsWithRef, ReactElement, RefCallback } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Button, IconButton, defineGlyph } from '../src/index.js';

afterEach(cleanup);

const glyph = defineGlyph((props) => <svg {...props} />);
type RouteProps = Omit<ComponentPropsWithRef<'a'>, 'href'> & { to: string };

function Route({ to, ...props }: RouteProps): ReactElement {
  return <a {...props} href={to} />;
}

it('resolves roles and tones independently, with no pressed state for plain actions', () => {
  render(
    <>
      <Button pressed={undefined}>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost" tone="accent" aria-expanded>
        Open
      </Button>
      <IconButton icon={glyph} aria-label="Default icon" />
      <IconButton icon={glyph} aria-label="Primary icon" variant="primary" />
    </>,
  );

  expect(screen.getAllByRole('button').map((node) => node.dataset.unicaButtonVariant)).toEqual([
    'primary',
    'secondary',
    'ghost',
    'secondary',
    'primary',
  ]);
  expect(screen.getAllByRole('button').map((node) => node.dataset.unicaButtonTone)).toEqual([
    'accent',
    'neutral',
    'accent',
    'neutral',
    'accent',
  ]);
  expect(screen.getAllByRole('button').every((node) => !node.hasAttribute('aria-pressed'))).toBe(
    true,
  );
  expect(screen.getByRole('button', { name: 'Open', expanded: true })).toBeDefined();
});

it('uses the latest accepted uncontrolled toggle value and the committed controlled value', () => {
  const local = vi.fn();
  const controlled = vi.fn();
  const cancelled = vi.fn();
  render(
    <>
      <Button defaultPressed={false} onPressedChange={local}>
        Local
      </Button>
      <Button pressed={false} defaultPressed onPressedChange={controlled}>
        Controlled
      </Button>
      <Button onClick={(event) => event.preventDefault()} onPressedChange={cancelled}>
        Cancelled
      </Button>
    </>,
  );
  const localButton = screen.getByRole('button', { name: 'Local' });
  const controlledButton = screen.getByRole('button', { name: 'Controlled' });

  act(() => {
    localButton.click();
    localButton.click();
    controlledButton.click();
    controlledButton.click();
    screen.getByRole('button', { name: 'Cancelled' }).click();
  });

  expect(local.mock.calls).toEqual([[true], [false]]);
  expect(controlled.mock.calls).toEqual([[true], [true]]);
  expect(cancelled).not.toHaveBeenCalled();
  expect(localButton.getAttribute('aria-pressed')).toBe('false');
  expect(controlledButton.getAttribute('aria-pressed')).toBe('false');
});

it('merges anchor descriptions and refs, and gives the child the first chance to cancel', () => {
  const rootRef = createRef<HTMLAnchorElement>();
  const attach = vi.fn<RefCallback<HTMLAnchorElement>>(() => release);
  const release = vi.fn();
  const outerClick = vi.fn();
  const childClick = vi.fn((event: React.MouseEvent<HTMLAnchorElement>) => event.preventDefault());
  const view = (loading: boolean) => (
    <IconButton
      asChild
      aria-label="Open guide"
      aria-describedby="second"
      icon={glyph}
      loading={loading}
      ref={rootRef}
      onClick={outerClick}
    >
      <Route
        to="#guide"
        aria-label=""
        aria-describedby="first second"
        aria-pressed
        aria-disabled
        ref={attach}
        onClick={childClick}
      />
    </IconButton>
  );
  const { rerender, unmount } = render(view(false));
  const link = screen.getByRole('link', { name: 'Open guide' });
  expect(rootRef.current).toBe(link);
  expect(attach).toHaveBeenCalledWith(link);
  expect(link.getAttribute('href')).toBe('#guide');
  expect(link.getAttribute('aria-describedby')).toBe('first second');
  expect(link.hasAttribute('aria-pressed')).toBe(false);
  expect(link.hasAttribute('aria-disabled')).toBe(false);
  fireEvent.click(link);
  expect(childClick).toHaveBeenCalledTimes(1);
  expect(outerClick).not.toHaveBeenCalled();

  rerender(view(true));
  const fallback = screen.getByRole('link', { name: 'Open guide' });
  expect(fallback).not.toBe(link);
  expect(rootRef.current).toBe(fallback);
  expect(attach).toHaveBeenLastCalledWith(fallback);
  expect(release).toHaveBeenCalledTimes(1);
  expect(fallback.getAttribute('href')).toBeNull();
  expect(fallback.getAttribute('tabindex')).toBe('0');
  expect(fallback.getAttribute('aria-busy')).toBe('true');
  fireEvent.click(fallback);
  expect(childClick).toHaveBeenCalledTimes(1);
  expect(outerClick).not.toHaveBeenCalled();

  unmount();
  expect(rootRef.current).toBeNull();
  expect(release).toHaveBeenCalledTimes(2);
});

it.each(
  [
    <Fragment key="fragment">Text</Fragment>,
    <button key="button" type="button">
      Wrong host
    </button>,
    <div key="div">Wrong host</div>,
    <a key="missing-destination">Missing destination</a>,
    [
      <a key="single" href="#guide">
        One in an array
      </a>,
    ],
  ].map((child) => ({ child })),
)('rejects an invalid available slotted host', ({ child }) => {
  expect(() => renderToString(<Button asChild>{child as ReactElement}</Button>)).toThrow(
    /Button asChild/,
  );
});

it('accepts an empty string href and leaves an unavailable intrinsic anchor in place', () => {
  const { container, rerender } = render(
    <Button asChild>
      <a href="">Guide</a>
    </Button>,
  );
  const link = container.querySelector('a');
  expect(link?.getAttribute('href')).toBe('');
  rerender(
    <Button asChild disabled>
      <a href="">Guide</a>
    </Button>,
  );
  expect(screen.getByRole('link', { name: 'Guide' })).toBe(link);
  expect(link?.getAttribute('href')).toBeNull();
  expect(link?.getAttribute('tabindex')).toBe('-1');
});

it('emits safe cold HTML while preserving submitter position, type and label', () => {
  const container = document.createElement('div');
  container.innerHTML = renderToString(
    <form>
      <Button loading type="submit" name="intent" value="save">
        Save
      </Button>
      <Button type="submit">Other</Button>
      <Button loading popoverTarget="panel">
        Open panel
      </Button>
      <Button loading>Normal command</Button>
    </form>,
  );
  const [save, other, invoker, command] = container.querySelectorAll('button');
  expect(save?.outerHTML).toContain('name="intent"');
  expect(save?.type).toBe('submit');
  expect(save?.disabled).toBe(true);
  expect(save?.hasAttribute('aria-busy')).toBe(false);
  expect(save?.textContent).toBe('Save');
  expect(other?.disabled).toBe(false);
  expect(invoker?.disabled).toBe(true);
  expect(command?.disabled).toBe(false);
  expect(command?.getAttribute('aria-busy')).toBe('true');
});
