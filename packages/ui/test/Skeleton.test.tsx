import { cleanup, fireEvent, render } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetDevWarnings } from '../src/core/devWarning.js';
import { Skeleton, SkeletonText } from '../src/index.js';
import type { SkeletonProps, SkeletonTextProps } from '../src/index.js';

afterEach(() => {
  cleanup();
  resetDevWarnings();
  vi.restoreAllMocks();
});

describe('Skeleton geometry props', () => {
  it.each([0, 24, '60%', '3ch', 'calc(100% - 8px)', 'var(--slot-width)'])(
    'gives width %s priority over inlineSize',
    (width) => {
      const ref = createRef<HTMLSpanElement>();
      render(<Skeleton ref={ref} width={width} style={{ inlineSize: 91 }} />);
      expect(ref.current?.style.inlineSize).toBe(typeof width === 'number' ? `${width}px` : width);
    },
  );

  it.each(['', ' \t ', -1, NaN, Infinity, -Infinity, false])(
    'ignores invalid dimensions (%s) and keeps supplied style',
    (invalid) => {
      const shapeRef = createRef<HTMLSpanElement>();
      const textRef = createRef<HTMLDivElement>();
      const unsafe = { width: invalid, height: invalid } as SkeletonProps;
      render(
        <>
          <Skeleton ref={shapeRef} {...unsafe} style={{ inlineSize: '45%', blockSize: 31 }} />
          <SkeletonText ref={textRef} width={unsafe.width} style={{ inlineSize: '45%' }} />
        </>,
      );
      expect(shapeRef.current?.style.inlineSize).toBe('45%');
      expect(shapeRef.current?.style.blockSize).toBe('31px');
      expect(textRef.current?.style.inlineSize).toBe('45%');
    },
  );

  it('holds the same root and dimensions when sending hidden to the DOM', () => {
    const ref = createRef<HTMLSpanElement>();
    const props = { shape: 'circle', height: 20, style: { blockSize: 30 } } as const;
    const { rerender } = render(<Skeleton ref={ref} {...props} />);
    const root = ref.current;
    expect(root?.tagName).toBe('SPAN');
    expect(root?.getAttribute('data-unica-skeleton-shape')).toBe('circle');
    expect(root?.style.blockSize).toBe('20px');

    rerender(<Skeleton ref={ref} {...props} hidden />);
    expect(ref.current).toBe(root);
    expect(root?.hidden).toBe(true);
    rerender(<Skeleton ref={ref} {...props} hidden={false} />);
    expect(root?.hidden).toBe(false);
    expect(root?.style.blockSize).toBe('20px');
  });
});

describe('SkeletonText geometry props', () => {
  it.each([
    [undefined, 3],
    [1, 1],
    [3, 3],
    [20, 20],
    [0, 1],
    [-4, 1],
    [1.9, 1],
    [21, 20],
    [NaN, 3],
    [Infinity, 3],
    [-Infinity, 3],
    ['4', 3],
  ])('renders %s as %s lines', (input, count) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const ref = createRef<HTMLDivElement>();
    render(<SkeletonText ref={ref} width={0} lines={input as SkeletonTextProps['lines']} />);
    expect(ref.current?.tagName).toBe('DIV');
    expect(ref.current?.childElementCount).toBe(count);
    expect(ref.current?.style.inlineSize).toBe('0px');
    const valid =
      input === undefined ||
      (typeof input === 'number' && Number.isInteger(input) && input >= 1 && input <= 20);
    expect(warn).toHaveBeenCalledTimes(valid ? 0 : 1);
  });
});

it('protects decorative DOM and leaves form submission and reset to the host', () => {
  const clicked = vi.fn();
  const unsafe = {
    role: 'button',
    tabIndex: 0,
    contentEditable: true,
    'aria-label': 'Unexpected',
    'aria-hidden': false,
    onClick: clicked,
    name: 'placeholder',
    children: 'Unexpected',
    dangerouslySetInnerHTML: { __html: '<b>Unexpected</b>' },
    shape: 'unknown',
    size: 'body-xs',
    'data-shape': 'circle',
    'data-size': 'body-s',
  } as const;

  const { container, getByTestId } = render(
    <form>
      <input name="summary" defaultValue="Draft" />
      <div contentEditable suppressContentEditableWarning>
        <Skeleton {...(unsafe as unknown as SkeletonProps)} data-testid="shape" />
        <SkeletonText
          {...(unsafe as unknown as SkeletonTextProps)}
          data-testid="text"
          data-count={3}
          className="preview"
          id="summary-placeholder"
          dir="rtl"
        />
      </div>
    </form>,
  );

  for (const name of ['shape', 'text']) {
    const element = getByTestId(name);
    expect(element.textContent).toBe('');
    expect(element.getAttribute('aria-hidden')).toBe('true');
    expect(element.getAttribute('contenteditable')).toBe('false');
    for (const attribute of ['role', 'tabindex', 'aria-label', 'name', 'inert']) {
      expect(element.hasAttribute(attribute)).toBe(false);
    }
    fireEvent.click(element);
  }

  const text = getByTestId('text');
  expect(text.id).toBe('summary-placeholder');
  expect(text.dir).toBe('rtl');
  expect(text.classList.contains('preview')).toBe(true);
  expect(text.dataset.count).toBe('3');
  expect(text.style.getPropertyValue('--_skeleton-line-height')).toBe('var(--text-size-body-m-lh)');
  expect(getByTestId('shape').hasAttribute('data-unica-skeleton-shape')).toBe(false);
  expect(clicked).not.toHaveBeenCalled();

  const form = container.querySelector('form')!;
  const input = form.querySelector('input')!;
  input.value = 'Updated';
  expect([...new FormData(form)]).toEqual([['summary', 'Updated']]);
  form.reset();
  expect([...new FormData(form)]).toEqual([['summary', 'Draft']]);
});
