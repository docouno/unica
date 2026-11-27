import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef, Fragment } from 'react';
import type { ComponentPropsWithRef, ReactElement } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Breadcrumb, BreadcrumbLink, BreadcrumbPage, Link } from '../src/index.js';

afterEach(cleanup);

it('omits an empty landmark and normalizes groups without losing zero or significant text', () => {
  const { rerender } = render(
    <Breadcrumb>{[null, undefined, false, <Fragment key="empty">{' \t\n'}</Fragment>]}</Breadcrumb>,
  );
  expect(screen.queryByRole('navigation')).toBeNull();

  rerender(
    <Breadcrumb>
      <>
        {[
          <BreadcrumbLink key="root" href="">
            Root
          </BreadcrumbLink>,
          0,
        ]}
        <>{true} </>
      </>
      {' Ops '}
      <BreadcrumbPage>Guide</BreadcrumbPage>
    </Breadcrumb>,
  );
  const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
  const list = within(nav).getByRole('list');
  expect(list.tagName).toBe('OL');
  const items = within(list).getAllByRole('listitem');
  expect(items.map((item) => item.lastElementChild?.textContent)).toEqual([
    'Root',
    '0',
    ' Ops ',
    'Guide',
  ]);
  expect(items.map((item) => item.querySelector('[aria-hidden="true"]')?.textContent)).toEqual([
    undefined,
    '/',
    '/',
    '/',
  ]);
  const root = nav.querySelector('a');
  expect(root?.getAttribute('href')).toBe('');
  expect(root?.getAttribute('aria-current')).toBeNull();
  expect(nav.querySelector('[aria-current="page"]')?.textContent).toBe('Guide');
});

it('preserves DOM identity for reordered keyed fragments with equal local keys', () => {
  const path = (names: readonly string[]) => (
    <Breadcrumb>
      {names.map((name) => (
        <Fragment key={name}>
          <BreadcrumbLink key="destination" href={`/${name}`}>
            {name}
          </BreadcrumbLink>
        </Fragment>
      ))}
    </Breadcrumb>
  );
  const { rerender } = render(path(['Root', 'Library']));
  const before = screen.getAllByRole('link');
  rerender(path(['Library', 'Root']));
  const after = screen.getAllByRole('link');
  expect(after[0]).toBe(before[1]);
  expect(after[1]).toBe(before[0]);
  expect(after.every((link) => !link.hasAttribute('aria-current'))).toBe(true);
});

it('hydrates the landmark, spacing mode and all three DOM refs', async () => {
  const nav = createRef<HTMLElement>();
  const link = createRef<HTMLAnchorElement>();
  const page = createRef<HTMLSpanElement>();
  const trail = (
    <>
      <h2 id="trail-title">Document path</h2>
      <Breadcrumb ref={nav} aria-labelledby="trail-title" size="s" separator={null}>
        <BreadcrumbLink ref={link} href="/workspace">
          Workspace
        </BreadcrumbLink>
        <BreadcrumbPage ref={page}>Runbooks</BreadcrumbPage>
      </Breadcrumb>
      <Breadcrumb>
        <>{null}</>
      </Breadcrumb>
    </>
  );
  const host = document.createElement('div');
  host.innerHTML = renderToString(trail);
  document.body.append(host);
  const before = within(host).getByRole('navigation', { name: 'Document path' });
  const onRecoverableError = vi.fn();
  const root = hydrateRoot(host, trail, { onRecoverableError });
  try {
    await act(async () => {});
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(nav.current).toBe(before);
    expect(link.current).toBe(within(before).getByRole('link', { name: 'Workspace' }));
    expect(page.current).toBe(before.querySelector('span[aria-current="page"]'));
    expect(within(host).getAllByRole('navigation')).toHaveLength(1);
    expect(before.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(
      within(before).getByRole('list').getAttribute('data-unica-breadcrumb-spacing-only'),
    ).toBe('');
  } finally {
    act(() => root.unmount());
    host.remove();
  }
  expect([nav.current, link.current, page.current]).toEqual([null, null, null]);
});

it('preserves label, attrs and paired refs through router fallback without mounting the router', () => {
  const outer = createRef<HTMLAnchorElement>();
  const inner = createRef<HTMLAnchorElement>();
  const callbacks = vi.fn();
  const childClick = vi.fn((event: React.MouseEvent) => event.preventDefault());
  const outerClick = vi.fn();
  const pointerDown = vi.fn();
  const keyDown = vi.fn();
  const childPointerDown = vi.fn();
  const childKeyDown = vi.fn();

  function Route({
    to,
    children,
    ...props
  }: Omit<ComponentPropsWithRef<'a'>, 'href'> & {
    readonly to: string;
  }): ReactElement {
    callbacks();
    return (
      <a {...props} href={to}>
        {children}
      </a>
    );
  }

  const trail = (disabled: boolean) => (
    <Breadcrumb>
      <BreadcrumbLink
        asChild
        ref={outer}
        disabled={disabled}
        onClick={outerClick}
        onPointerDownCapture={pointerDown}
        onKeyDown={keyDown}
        aria-describedby="outer-description"
        className="outer"
      >
        <Route
          to="#guide"
          ref={inner}
          onClick={childClick}
          onPointerDown={childPointerDown}
          onKeyDownCapture={childKeyDown}
          tabIndex={0}
          target="_BLANK"
          rel="Opener next"
          download="guide.html"
          aria-current="page"
          aria-label="Guide link"
          aria-describedby="inner-description"
          className="inner"
        >
          Guide
        </Route>
      </BreadcrumbLink>
    </Breadcrumb>
  );

  const view = render(trail(false));
  const enabled = screen.getByRole('link', { name: 'Guide link' });
  expect(enabled.getAttribute('href')).toBe('#guide');
  expect(enabled.getAttribute('rel')).toBe('next noopener noreferrer');
  expect(enabled.getAttribute('download')).toBe('guide.html');
  expect(enabled.getAttribute('aria-describedby')).toBe('inner-description outer-description');
  expect(enabled.querySelector('svg')).toBeNull();
  expect([outer.current, inner.current]).toEqual([enabled, enabled]);
  fireEvent.pointerDown(enabled);
  fireEvent.keyDown(enabled, { key: 'Enter' });
  fireEvent.click(enabled);
  expect(childClick).toHaveBeenCalledTimes(1);
  expect(outerClick).not.toHaveBeenCalled();
  expect(pointerDown).toHaveBeenCalledTimes(1);
  expect(keyDown).toHaveBeenCalledTimes(1);
  expect(childPointerDown).toHaveBeenCalledTimes(1);
  expect(childKeyDown).toHaveBeenCalledTimes(1);

  view.rerender(trail(true));
  const disabled = screen.getByRole('link', { name: 'Guide link', current: 'page' });
  expect(disabled).not.toBe(enabled);
  expect(disabled.getAttribute('aria-disabled')).toBe('true');
  expect(disabled.getAttribute('aria-describedby')).toBe('inner-description outer-description');
  expect(disabled.textContent).toBe('Guide');
  expect(disabled.classList.contains('inner')).toBe(true);
  for (const attr of ['href', 'target', 'rel', 'download', 'to', 'tabindex']) {
    expect(disabled.hasAttribute(attr)).toBe(false);
  }
  expect([outer.current, inner.current]).toEqual([disabled, disabled]);
  fireEvent.pointerDown(disabled);
  fireEvent.keyDown(disabled, { key: 'Enter' });
  fireEvent.click(disabled);
  expect(callbacks).toHaveBeenCalledTimes(1);
  expect(childClick).toHaveBeenCalledTimes(1);
  expect(outerClick).not.toHaveBeenCalled();
  expect(pointerDown).toHaveBeenCalledTimes(1);
  expect(keyDown).toHaveBeenCalledTimes(1);
  expect(childPointerDown).toHaveBeenCalledTimes(1);
  expect(childKeyDown).toHaveBeenCalledTimes(1);

  view.rerender(trail(false));
  fireEvent.click(screen.getByRole('link'));
  expect(callbacks).toHaveBeenCalledTimes(2);
  expect(childClick).toHaveBeenCalledTimes(2);
  view.unmount();
  expect([outer.current, inner.current]).toEqual([null, null]);
});

it('preserves explicit current only for a disabled breadcrumb link', () => {
  render(
    <>
      <Breadcrumb>
        <BreadcrumbLink disabled aria-current="page" tabIndex={0} target="_blank" href="/archive">
          Archive
        </BreadcrumbLink>
      </Breadcrumb>
      <Link disabled aria-current="page" href="/other">
        Ordinary Link
      </Link>
    </>,
  );
  const archive = screen.getByRole('link', { name: 'Archive', current: 'page' });
  expect(archive.hasAttribute('tabindex')).toBe(false);
  expect(archive.hasAttribute('href')).toBe(false);
  expect(archive.hasAttribute('target')).toBe(false);
  expect(screen.getByRole('link', { name: 'Ordinary Link' }).hasAttribute('aria-current')).toBe(
    false,
  );
});
