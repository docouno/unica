import { Fragment, createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Empty,
  EmptyActions,
  EmptyDescription,
  EmptyMedia,
  EmptyTitle,
  defineGlyph,
} from '../src/index.js';
import type { EmptyTitleProps } from '../src/index.js';

const glyph = defineGlyph((props) => <svg {...props} viewBox="0 0 16 16" />);

afterEach(cleanup);

it('hydrates without replacing the native heading and glyph', async () => {
  const ref = createRef<HTMLHeadingElement>();
  const tree = (
    <Empty size="l">
      <EmptyMedia icon={glyph} />
      <EmptyTitle ref={ref} as="h1">
        No reports
      </EmptyTitle>
      <EmptyDescription>Try again later.</EmptyDescription>
    </Empty>
  );
  const host = document.body.appendChild(document.createElement('div'));
  host.innerHTML = renderToString(tree);
  const serverHeading = host.querySelector('h1');
  const serverGlyph = host.querySelector('svg');
  expect(serverHeading).not.toBeNull();
  expect(serverGlyph).not.toBeNull();
  const onRecoverableError = vi.fn();
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    await act(() => {
      root = hydrateRoot(host, tree, { onRecoverableError });
      return Promise.resolve();
    });
    expect(ref.current).toBe(serverHeading);
    expect(host.querySelector('svg')).toBe(serverGlyph);
    expect(onRecoverableError).not.toHaveBeenCalled();
  } finally {
    act(() => root?.unmount());
    host.remove();
  }
});

it('uses passive native elements and forwards the five refs and attributes', () => {
  const root = createRef<HTMLDivElement>();
  const media = createRef<HTMLDivElement>();
  const title = createRef<HTMLHeadingElement>();
  const description = createRef<HTMLParagraphElement>();
  const actions = createRef<HTMLDivElement>();
  const onClick = vi.fn();
  render(
    <Empty ref={root} dir="rtl" lang="en" data-extra="keep" className="host">
      <EmptyMedia ref={media} icon={glyph} aria-hidden={false} color="danger" />
      <EmptyTitle ref={title} as="h6" tabIndex={-1}>
        Empty
      </EmptyTitle>
      <EmptyDescription ref={description}>No reports.</EmptyDescription>
      <EmptyActions ref={actions} onClick={onClick}>
        <button>Try again</button>
      </EmptyActions>
    </Empty>,
  );
  expect(root.current?.tagName).toBe('DIV');
  expect(root.current?.classList.contains('host')).toBe(true);
  expect(root.current?.getAttribute('data-extra')).toBe('keep');
  expect(root.current?.dir).toBe('rtl');
  expect(root.current?.lang).toBe('en');
  expect(root.current?.hasAttribute('role')).toBe(false);
  expect(root.current?.hasAttribute('tabindex')).toBe(false);
  expect(root.current?.hasAttribute('aria-live')).toBe(false);
  expect(media.current?.getAttribute('aria-hidden')).toBe('true');
  expect(media.current?.querySelector('svg')?.getAttribute('focusable')).toBe('false');
  expect(title.current).toBe(screen.getByRole('heading', { level: 6, name: 'Empty' }));
  expect(title.current?.tabIndex).toBe(-1);
  expect(description.current?.tagName).toBe('P');
  expect(actions.current?.tagName).toBe('DIV');
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(onClick).toHaveBeenCalledOnce();
});

it('omits empty parts, keeps zero and prefers an illustration with its own alternative', () => {
  const { container } = render(
    <Empty>
      <EmptyMedia data-testid="missing" />
      <EmptyTitle>{[' ', null, <Fragment key="fragment"> </Fragment>]}</EmptyTitle>
      <EmptyDescription>{0}</EmptyDescription>
      <EmptyActions>{[false, undefined, []]}</EmptyActions>
      <EmptyMedia icon={glyph} color="danger">
        <img src="/chart.svg" alt="A completed checklist" />
      </EmptyMedia>
      <EmptyMedia icon={glyph} data-testid="fallback">
        <>{false} </>
      </EmptyMedia>
    </Empty>,
  );
  expect(screen.queryByTestId('missing')).toBeNull();
  expect(screen.queryByRole('heading')).toBeNull();
  expect(container.firstElementChild?.children).toHaveLength(3);
  expect(screen.getByText('0').tagName).toBe('P');
  const illustration = screen.getByRole('img', { name: 'A completed checklist' });
  expect(illustration.parentElement?.querySelector('svg')).toBeNull();
  expect(illustration.parentElement?.hasAttribute('data-unica-empty-color')).toBe(false);
  expect(screen.getByTestId('fallback').querySelector('svg')).not.toBeNull();
});

it('scopes typography to the nearest root and keeps semantic levels independent of size', () => {
  const untyped = { color: 'danger' } as unknown as Pick<EmptyTitleProps, 'color'>;
  render(
    <Empty size="l">
      <EmptyTitle as="h6" {...untyped}>
        Outer
      </EmptyTitle>
      <EmptyDescription {...untyped}>Outer copy</EmptyDescription>
      <Empty size="s">
        <EmptyTitle as="h1">Inner</EmptyTitle>
        <EmptyDescription>Inner copy</EmptyDescription>
      </Empty>
    </Empty>,
  );
  const outer = screen.getByRole('heading', { level: 6, name: 'Outer' });
  const inner = screen.getByRole('heading', { level: 1, name: 'Inner' });
  expect(outer.getAttribute('data-unica-title-size')).toBe('heading-xl');
  expect(inner.getAttribute('data-unica-title-size')).toBe('heading-s');
  expect(screen.getByText('Outer copy').style.getPropertyValue('--_type-size')).toBe(
    'var(--text-size-body-m)',
  );
  expect(screen.getByText('Inner copy').style.getPropertyValue('--_type-size')).toBe(
    'var(--text-size-body-s)',
  );
  for (const text of [outer, screen.getByText('Outer copy')]) {
    expect(text.hasAttribute('color')).toBe(false);
    expect(text.hasAttribute('data-unica-type-color')).toBe(false);
  }
});
