import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import type { MouseEvent } from 'react';
import { renderToString } from 'react-dom/server';
import { afterEach, expect, it, vi } from 'vitest';
import { Blockquote, Code, defineGlyph, IconProvider } from '../src/index.js';
import type { GlyphSvgProps } from '../src/index.js';

afterEach(cleanup);

function Mark(props: GlyphSvgProps) {
  return <svg {...props} viewBox="0 0 32 16" />;
}

it('keeps a single native code element with its text, ref, attributes, and copy event', () => {
  const ref = createRef<HTMLElement>();
  const onCopy = vi.fn();
  render(
    <Code
      ref={ref}
      id="limit"
      lang="ar"
      dir="auto"
      hidden
      className="custom"
      aria-describedby="limit-help"
      onCopy={onCopy}
    >
      {0}
    </Code>,
  );

  const code = document.getElementById('limit')!;
  expect(ref.current).toBe(code);
  expect(code.outerHTML).toMatch(/^<code .*?>0<\/code>$/);
  expect(code.childElementCount).toBe(0);
  expect(code.classList.contains('custom')).toBe(true);
  expect(code.dir).toBe('auto');
  expect(code.lang).toBe('ar');
  expect(code.hidden).toBe(true);
  expect(code.getAttribute('aria-describedby')).toBe('limit-help');
  fireEvent.copy(code);
  expect(onCopy).toHaveBeenCalledTimes(1);
});

it('renders a figure with mixed quoted content and a separate optional source', () => {
  const ref = createRef<HTMLElement>();
  const onClick = vi.fn((event: MouseEvent<HTMLElement>) => event.preventDefault());
  render(
    <IconProvider adapter="native">
      <Blockquote
        ref={ref}
        citeUrl="/guide"
        attribution={<a href="/guide">Guide</a>}
        id="excerpt"
        aria-label="Excerpt"
        className="custom"
        iconLeft={Mark}
        iconRight={defineGlyph(Mark)}
        onClick={onClick}
      >
        First <strong>read</strong>
        <ul>
          <li>Check the source.</li>
        </ul>
      </Blockquote>
    </IconProvider>,
  );

  const figure = screen.getByRole('figure', { name: 'Excerpt' });
  const quote = figure.querySelector('blockquote')!;
  const caption = figure.lastElementChild!;
  expect(ref.current).toBe(figure);
  expect(figure.tagName).toBe('FIGURE');
  expect(figure.id).toBe('excerpt');
  expect(figure.classList.contains('custom')).toBe(true);
  expect(figure.hasAttribute('cite')).toBe(false);
  expect(quote.getAttribute('cite')).toBe('/guide');
  expect(quote.firstChild?.textContent).toBe('First ');
  expect(quote.querySelector('strong')?.textContent).toBe('read');
  expect(quote.querySelector('ul > li')?.textContent).toBe('Check the source.');
  expect(caption.tagName).toBe('FIGCAPTION');
  expect(caption.parentElement).toBe(figure);
  const link = screen.getByRole('link', { name: 'Guide' });
  expect(caption.contains(link)).toBe(true);
  fireEvent.click(link);
  expect(onClick).toHaveBeenCalledTimes(1);
  const glyphs = figure.querySelectorAll('svg');
  expect(glyphs).toHaveLength(2);
  for (const glyph of glyphs) {
    expect(glyph.getAttribute('viewBox')).toBe('0 0 32 16');
    expect(glyph.getAttribute('aria-hidden')).toBe('true');
    expect(glyph.getAttribute('focusable')).toBe('false');
    expect(glyph.hasAttribute('tabindex')).toBe(false);
  }
});

it.each([undefined, null, false, true, ''])('omits the caption for %s', (attribution) => {
  const { container } = render(<Blockquote attribution={attribution}>Excerpt</Blockquote>);
  expect(container.querySelector('figcaption')).toBeNull();
});

it('preserves zero in a quotation and attribution', () => {
  const { container } = render(<Blockquote attribution={0}>{0}</Blockquote>);
  expect(container.querySelector('blockquote')?.textContent).toBe('0');
  expect(container.querySelector('figcaption')?.textContent).toBe('0');
});

it.each([Code, Blockquote])(
  'filters owned semantics in client and server rendering',
  (Component) => {
    // Model values forwarded by a JavaScript consumer.
    const spread = {
      role: 'button',
      tabIndex: 0,
      tabindex: 0,
      dangerouslySetInnerHTML: { __html: '<b>Replacement</b>' },
      dangerouslysetinnerhtml: '<b>Replacement</b>',
      contentEditable: 'plaintext-only',
      contenteditable: '',
      'aria-label': 'Author label',
      'aria-labelledby': 'author',
      'aria-describedby': 'description',
    } as Record<string, unknown>;
    const element = <Component {...spread}>Original</Component>;
    const { container } = render(element);
    const server = document.createElement('div');
    server.innerHTML = renderToString(element);

    for (const host of [container, server]) {
      const root = host.firstElementChild!;
      for (const key of ['role', 'tabindex', 'dangerouslysetinnerhtml', 'contenteditable']) {
        expect(root.hasAttribute(key), key).toBe(false);
      }
      expect(root.getAttribute('aria-label')).toBe(Component === Code ? null : 'Author label');
      expect(root.getAttribute('aria-labelledby')).toBe(Component === Code ? null : 'author');
      expect(root.getAttribute('aria-describedby')).toBe('description');
      expect(root.textContent).toBe('Original');
    }
  },
);

it.each([Code, Blockquote])(
  'normalizes editability to a native opt-out or inheritance',
  (Component) => {
    const { container } = render(
      <>
        <Component contentEditable={false}>Boolean false</Component>
        <Component contentEditable="false">String false</Component>
        <Component {...{ contenteditable: 'false' }}>Native false</Component>
        <Component contentEditable="inherit">Inherit</Component>
        <Component {...{ contenteditable: 'true' }}>Native true</Component>
      </>,
    );
    expect(Array.from(container.children, (node) => node.getAttribute('contenteditable'))).toEqual([
      'false',
      'false',
      'false',
      null,
      null,
    ]);
  },
);
