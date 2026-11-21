import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { hydrateRoot } from 'react-dom/client';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Divider, type DividerProps } from '../src/index.js';

afterEach(cleanup);

it('preserves one div ref across native, labeled and vertical configurations', () => {
  const root = createRef<HTMLDivElement>();
  const attrs = {
    ref: root,
    id: 'boundary',
    className: 'owned-spacing',
    style: { marginBlock: 4 },
    lang: 'ar',
    dir: 'rtl',
    'data-wb-subject': '',
    'data-testid': 'divider',
  } as const;
  const { rerender } = render(<Divider {...attrs} />);
  const original = screen.getByTestId('divider');
  expect(original.tagName).toBe('DIV');
  expect(root.current).toBe(original);
  expect(original.matches('#boundary.owned-spacing[lang="ar"][dir="rtl"][data-wb-subject]')).toBe(
    true,
  );
  expect(root.current?.style.marginBlock).toBe('4px');
  expect(original.firstElementChild?.tagName).toBe('HR');
  expect(original.getAttribute('aria-hidden')).toBe('true');
  expect(screen.queryByRole('separator')).toBeNull();

  rerender(<Divider {...attrs} decorative={false} aria-label="Sections" />);
  const rule = screen.getByRole('separator', { name: 'Sections' });
  expect(original.hasAttribute('aria-label')).toBe(false);
  expect(screen.getAllByRole('separator')).toEqual([original.firstElementChild]);
  expect(rule.tagName).toBe('HR');

  rerender(<Divider {...attrs} label=" or continue " />);
  expect(original.textContent).toBe(' or continue ');
  expect(original.querySelectorAll('span[aria-hidden="true"]')).toHaveLength(2);
  expect(original.hasAttribute('aria-hidden')).toBe(false);
  expect(screen.queryByRole('separator')).toBeNull();

  rerender(<Divider {...attrs} orientation="vertical" decorative={false} aria-label="Actions" />);
  expect(root.current).toBe(original);
  expect(screen.getByRole('separator', { name: 'Actions' })).toBe(original);
  expect(original.getAttribute('aria-orientation')).toBe('vertical');
  expect(original.querySelector('hr')).toBeNull();

  rerender(<Divider {...attrs} orientation="vertical" hidden />);
  expect(original.hasAttribute('hidden')).toBe(true);
  expect(original.getAttribute('aria-hidden')).toBe('true');
});

it('blocks JavaScript overrides and gives the supported modes deterministic precedence', () => {
  const onClick = vi.fn();
  const untyped = (props: Record<string, unknown>): DividerProps => props as DividerProps;
  const overrides = {
    role: 'slider',
    'aria-hidden': true,
    'aria-orientation': 'vertical',
    'aria-valuenow': 6,
    'aria-label': 'Fake name',
    tabIndex: 0,
    autoFocus: true,
    contentEditable: true,
    draggable: true,
    onClick,
    children: 'Injected text',
    dangerouslySetInnerHTML: { __html: '<button>Injected action</button>' },
    'data-unica-divider-orientation': 'vertical',
    'data-unica-divider-label-position': 'start',
    'data-Unica-Divider-extra': 'owned',
    'data-owner': true,
    'data-object': { value: 1 },
    unknownAttribute: 'ignored',
  };
  const { rerender } = render(
    <Divider
      {...untyped({
        ...overrides,
        label: '<b>or</b>',
        decorative: false,
        'data-testid': 'divider',
      })}
    />,
  );
  const divider = screen.getByTestId('divider');
  fireEvent.click(divider);
  expect(onClick).not.toHaveBeenCalled();
  expect(divider.textContent).toBe('<b>or</b>');
  expect(divider.querySelector('b, button')).toBeNull();
  expect(
    Object.fromEntries([...divider.attributes].map(({ name, value }) => [name, value])),
  ).toEqual({
    class: 'unica-divider',
    'data-owner': 'true',
    'data-testid': 'divider',
    'data-unica-divider-label-position': 'center',
    'data-unica-divider-orientation': 'horizontal',
  });

  rerender(
    <Divider {...untyped({ orientation: 'vertical', label: 'ignored', labelPosition: 'end' })} />,
  );
  expect(divider.getAttribute('data-unica-divider-orientation')).toBe('vertical');
  expect(divider.hasAttribute('data-unica-divider-label-position')).toBe(false);
  expect(divider.textContent).toBe('');
  expect(divider.getAttribute('aria-hidden')).toBe('true');

  rerender(<Divider {...untyped({ label: 5, decorative: false, 'aria-label': 'Plain rule' })} />);
  expect(screen.getByRole('separator', { name: 'Plain rule' }).tagName).toBe('HR');

  rerender(<Divider label={' \t '} labelPosition="end" />);
  expect(divider.firstElementChild?.tagName).toBe('HR');
  expect(divider.hasAttribute('data-unica-divider-label-position')).toBe(false);
  expect(divider.getAttribute('aria-hidden')).toBe('true');
});

it('hydrates each branch in place with the same markup', () => {
  const ref = createRef<HTMLDivElement>();
  const view = (
    <>
      <Divider ref={ref} decorative={false} aria-label="Hydrated sections" />
      <Divider label="or continue" labelPosition="start" />
      <Divider orientation="vertical" />
    </>
  );
  const container = document.createElement('div');
  container.innerHTML = renderToString(view);
  const before = [...container.children];
  const markup = container.innerHTML;
  const onRecoverableError = vi.fn();
  const consoleError = vi.spyOn(console, 'error');
  let root: ReturnType<typeof hydrateRoot> | undefined;
  try {
    act(() => {
      root = hydrateRoot(container, view, { onRecoverableError });
    });
    expect(ref.current).toBe(before[0]);
    expect(container.innerHTML).toBe(markup);
    before.forEach((node, index) => expect(container.children[index]).toBe(node));
    expect(onRecoverableError).not.toHaveBeenCalled();
    expect(consoleError).not.toHaveBeenCalled();
  } finally {
    act(() => root?.unmount());
    consoleError.mockRestore();
  }
});
