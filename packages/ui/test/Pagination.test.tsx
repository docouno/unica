import { createRef } from 'react';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { Pagination } from '../src/index.js';

afterEach(cleanup);

function current(nav = screen.getByRole('navigation')): string | null | undefined {
  return nav.querySelector('[aria-current="page"]')?.getAttribute('aria-label');
}

it.each([
  [7, 4, [1, 2, 3, 4, 5, 6, 7]],
  [8, 5, [1, 4, 5, 6, 7, 8]],
  [24, 12, [1, 11, 12, 13, 24]],
  [24, 4, [1, 2, 3, 4, 5, 24]],
  [Number.MAX_SAFE_INTEGER, 12, [1, 11, 12, 13, Number.MAX_SAFE_INTEGER]],
])('bounds the number of controls for %s pages at %s', (pageCount, page, expected) => {
  const getPageHref = vi.fn((number: number) => `/pages/${number}`);
  render(<Pagination pageCount={pageCount} page={page} getPageHref={getPageHref} />);
  const nav = screen.getByRole('navigation');
  expect(current()).toBe(`Page ${page}`);
  expect(
    within(nav)
      .getAllByRole('link', { name: /^Page /u })
      .map((link) => link.getAttribute('href')),
  ).toEqual(expected.map((number) => `/pages/${number}`));
  expect(getPageHref).toHaveBeenCalledTimes(expected.length + 2);
});

it.each([0, 1, -4, 2.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'omits the landmark and destination work for count %s',
  (pageCount) => {
    const ref = createRef<HTMLElement>();
    const getPageHref = vi.fn(() => '/pages');
    const { rerender } = render(
      <Pagination ref={ref} pageCount={4} page={1} getPageHref={getPageHref} />,
    );
    expect(ref.current).toBe(screen.getByRole('navigation'));
    getPageHref.mockClear();
    rerender(<Pagination ref={ref} pageCount={pageCount} page={1} getPageHref={getPageHref} />);
    expect(ref.current).toBeNull();
    expect(getPageHref).not.toHaveBeenCalled();
  },
);

it('commits a valid local clamp and preserves the controlled request', () => {
  const onPageChange = vi.fn();
  const tree = (pageCount: number) => (
    <>
      <Pagination
        pageCount={pageCount}
        defaultPage={12}
        aria-label="Local"
        onPageChange={onPageChange}
      />
      <Pagination
        pageCount={pageCount}
        page={12}
        aria-label="Controlled"
        onPageChange={onPageChange}
      />
    </>
  );
  const { rerender } = render(tree(24));
  const local = screen.getByRole('navigation', { name: 'Local' });
  const controlled = screen.getByRole('navigation', { name: 'Controlled' });
  rerender(tree(4));
  expect([current(local), current(controlled)]).toEqual(['Page 4', 'Page 4']);
  rerender(tree(24));
  expect([current(local), current(controlled)]).toEqual(['Page 4', 'Page 12']);
  expect(onPageChange).not.toHaveBeenCalled();
  fireEvent.click(within(local).getByRole('button', { name: 'Next page' }));
  fireEvent.click(within(local).getByRole('button', { name: 'Page 5' }));
  fireEvent.click(within(controlled).getByRole('button', { name: 'Next page' }));
  fireEvent.click(within(controlled).getByRole('button', { name: 'Next page' }));
  expect(onPageChange.mock.calls).toEqual([[5], [13], [13]]);
  expect(current(controlled)).toBe('Page 12');
});

it('retains the local position across an empty range and clamps it to a single page', () => {
  const { rerender } = render(<Pagination pageCount={0} defaultPage={9} />);
  rerender(<Pagination pageCount={10} defaultPage={3} />);
  expect(current()).toBe('Page 9');
  rerender(<Pagination pageCount={1} defaultPage={9} />);
  rerender(<Pagination pageCount={10} defaultPage={9} />);
  expect(current()).toBe('Page 1');
});

it('uses the last committed address when switching the same instance to local buttons', () => {
  const onPageChange = vi.fn();
  const { rerender } = render(
    <Pagination pageCount={7} page={4} getPageHref={(page) => `/pages/${page}`} />,
  );
  rerender(<Pagination pageCount={7} defaultPage={1} onPageChange={onPageChange} />);
  expect(current()).toBe('Page 4');
  expect(onPageChange).not.toHaveBeenCalled();
  rerender(<Pagination key="reset" pageCount={7} defaultPage={1} onPageChange={onPageChange} />);
  expect(current()).toBe('Page 1');
});

it.each([
  [-3, 1],
  [5.8, 5],
  [NaN, 1],
  [Infinity, 1],
  [80, 7],
])('normalizes a supplied page of %s to %s', (page, expected) => {
  render(<Pagination pageCount={7} page={page} aria-label=" " />);
  expect(current(screen.getByRole('navigation', { name: 'Pagination' }))).toBe(`Page ${expected}`);
});

it('uses native landmark naming, root attributes, and the consumer event handler', () => {
  const onClick = vi.fn();
  render(
    <>
      <h2 id="results-title">Report pages</h2>
      <Pagination
        aria-labelledby="results-title"
        aria-label="Page controls"
        pageCount={3}
        id="pages"
        className="report-pages"
        data-source="reports"
        onClick={onClick}
      />
    </>,
  );
  const nav = screen.getByRole('navigation', { name: 'Report pages' });
  expect(nav.id).toBe('pages');
  expect(nav.classList.contains('report-pages')).toBe(true);
  expect(nav.dataset.source).toBe('reports');
  fireEvent.click(within(nav).getByRole('button', { name: 'Next page' }));
  expect(onClick).toHaveBeenCalledOnce();
});

it.each([
  '012345678 ',
  '012345678\u2067',
  '012345678\uFE0F',
  '012345678\uD800',
  '012345678\u{13430}',
  '012345678\uFDD0',
  '012345678\u{10FFFF}',
])('falls back independently from invisible digits in %s', (digits) => {
  render(<Pagination pageCount={11} page={9} messages={{ digits, nextPage: 'Continue' }} />);
  expect(current()).toBe('Page 9');
  expect(screen.getByRole('button', { name: 'Continue' })).toBeDefined();
});
