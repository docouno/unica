import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { MarkdownView } from './MarkdownView.js';
import { extractMarkdownHeadings, isSafeHref } from './markdownParser.js';

afterEach(cleanup);

const sampleDoc = `# Component Overview

Use \`Button\` for **primary** actions, *secondary* flows, and ~~deprecated~~ items. Keep snake_case_identifiers untouched.

## Props & Layout

| Prop | Alignment | Notes |
| :--- | ---: | :---: |
| \`variant\` | 100 | Supports \`a \\| b\` values |
| \`tone\` | 200 | Default neutral |

> [!NOTE]
> Follow [Spinner](spinner.md), [External](https://example.com/docs), and ignore [Bad](javascript:alert(1)).

- First item
  - Nested child
- Second item

\`\`\`tsx
// ## Not a heading
const html = '<script>alert(1)</script>';
\`\`\`

## Accessibility

Raw <script>alert("xss")</script> stays text.
`;

it('extracts top-level h2 headings while ignoring fenced code blocks', () => {
  expect(extractMarkdownHeadings(sampleDoc)).toEqual([
    { id: 'wb-doc-props-layout', level: 2, text: 'Props & Layout' },
    { id: 'wb-doc-accessibility', level: 2, text: 'Accessibility' },
  ]);
});

it('renders GFM tables, lists, alerts, safe links and inert text without raw HTML execution', () => {
  const navigate = vi.fn();
  const { container } = render(
    <MarkdownView
      markdown={sampleDoc}
      resolveLink={(href) =>
        href === 'spinner.md' ? { href: '?item=spinner&tab=usage', onNavigate: navigate } : null
      }
    />,
  );

  // Heading levels shift by +1 so Markdown H1 becomes H2 under the Workbench H1.
  expect(screen.getByRole('heading', { level: 2, name: 'Component Overview' })).toBeTruthy();
  expect(screen.getByRole('heading', { level: 3, name: 'Props & Layout' })).toBeTruthy();
  expect(screen.getByText(/snake_case_identifiers/)).toBeTruthy();
  expect(container.querySelector('em')?.textContent).toBe('secondary');

  // Table with escaped pipe and alignment.
  const table = screen.getByRole('table');
  expect(table.textContent).toContain('a | b');
  const alignedCell = screen.getByRole('cell', { name: '100' });
  expect(alignedCell.style.textAlign).toBe('right');

  // Alert blockquote and nested list.
  expect(container.querySelector('blockquote[data-wb-alert="note"]')).toBeTruthy();
  expect(screen.getByText('Nested child').closest('ul ul')).toBeTruthy();

  // Internal resolved link navigates in place; external opens safely; javascript: is never an anchor.
  const internal = screen.getByRole('link', { name: 'Spinner' });
  fireEvent.click(internal);
  expect(navigate).toHaveBeenCalledTimes(1);

  const external = screen.getByRole('link', { name: 'External' });
  expect(external.getAttribute('target')).toBe('_blank');
  expect(external.getAttribute('rel')).toBe('noopener noreferrer');

  expect(screen.queryByRole('link', { name: 'Bad' })).toBeNull();
  expect(screen.getByText('Bad').tagName).toBe('SPAN');

  // No injected <script> elements exist in the DOM.
  expect(container.querySelector('script')).toBeNull();
  expect(container.textContent).toContain('Raw <script>alert("xss")</script> stays text.');
});

it('handles duplicate heading slugs, trailing C# hashes, in-doc anchors, adversarial URLs, fences, loose lists, and raw mode', () => {
  const edgeDoc = [
    '## C#',
    '',
    `## Long heading${' '.repeat(4000)}`,
    '',
    '## Props',
    '',
    '## Props',
    '',
    '## Props 2',
    '',
    'Jump to [Props](#Props).',
    '',
    'Reject [vb](vbscript:msgbox(1)), [data](DATA:text/html,<script>), [ctrl](java\tscript:alert(1)), [nul](java\x00script:alert(1)), [proto](//evil.example/x), [slash](/\\evil.example/x).',
    '',
    'a \\| b',
    '---',
    '',
    'foo | bar',
    '---',
    '',
    'Inline ``a`b`` and **bold `**` still** plus [`a]` code](https://example.com) and [outer [inner](https://b.example)](https://a.example).',
    '',
    '| `Prop` | **Notes** |',
    '| --- | --- |',
    '| size | scale |',
    '',
    '- First loose item',
    '',
    '- Second loose item',
    '',
    '~~~~md',
    '```tsx',
    'const nested = true;',
    '```',
    '~~~~',
  ].join('\n');

  expect(isSafeHref('https://example.com')).toBe(true);
  expect(isSafeHref('mailto:team@example.com')).toBe(true);
  expect(isSafeHref('#props')).toBe(true);
  expect(isSafeHref('java\tscript:alert(1)')).toBe(false);
  expect(isSafeHref('java\x00script:alert(1)')).toBe(false);
  expect(isSafeHref('//evil.example')).toBe(false);
  expect(isSafeHref('/\\evil.example')).toBe(false);
  expect(isSafeHref('\\\\evil.example')).toBe(false);

  const headings = extractMarkdownHeadings(edgeDoc);
  expect(headings.map((heading) => [heading.text, heading.id])).toEqual([
    ['C#', 'wb-doc-c'],
    ['Long heading', 'wb-doc-long-heading'],
    ['Props', 'wb-doc-props'],
    ['Props', 'wb-doc-props-2'],
    ['Props 2', 'wb-doc-props-2-2'],
  ]);

  const { container } = render(
    <MarkdownView
      markdown={`${edgeDoc}\n\nCheck [unsafe-resolved](local.md).`}
      resolveLink={(href) => (href === 'local.md' ? { href: 'javascript:alert(1)' } : null)}
    />,
  );
  expect(screen.getByRole('heading', { level: 3, name: 'C#' })).toBeTruthy();

  // Mixed-case in-doc anchor rewrites to lowercased prefixed wb-doc- target.
  const anchor = screen.getByRole('link', { name: 'Props' });
  expect(anchor.getAttribute('href')).toBe('#wb-doc-props');

  // Adversarial URLs stay inert spans with NO title attribute, never anchors.
  for (const label of ['vb', 'data', 'ctrl', 'nul', 'proto', 'slash']) {
    expect(screen.queryByRole('link', { name: label })).toBeNull();
    const span = screen.getByText(label);
    expect(span.tagName).toBe('SPAN');
    expect(span.getAttribute('title')).toBeNull();
  }
  // Unsafe href returned by resolveLink is also rejected and never becomes an anchor.
  expect(screen.queryByRole('link', { name: 'unsafe-resolved' })).toBeNull();

  // Multi-backtick code span, code inside strong/link, and no nested <a>.
  expect(container.querySelector('code')?.textContent).toBe('a`b');
  expect(container.querySelector('strong')?.textContent).toBe('bold ** still');
  expect(screen.getByRole('link', { name: 'a] code' }).getAttribute('href')).toBe(
    'https://example.com',
  );
  const outerLink = screen.getByRole('link', { name: /outer/ });
  expect(outerLink.getAttribute('href')).toBe('https://a.example');
  expect(outerLink.querySelector('a')).toBeNull();

  // Escaped-pipe and pipe+HR paragraphs must not parse as tables; real table strips syntax from region label.
  expect(container.querySelectorAll('table')).toHaveLength(1);
  expect(container.querySelectorAll('hr')).toHaveLength(2);
  expect(screen.getByRole('region', { name: 'Prop, Notes' })).toBeTruthy();

  // Loose list stays a single <ul> with two <li> items.
  const lists = container.querySelectorAll('ul');
  expect(lists).toHaveLength(1);
  expect(lists[0]!.querySelectorAll('li')).toHaveLength(2);

  // 4-tilde fence keeps inner triple-backtick code intact and exposes Copy in normal mode.
  expect(container.querySelector('pre code')?.textContent).toContain('const nested = true;');
  expect(screen.getByRole('button', { name: /Copy md snippet/ })).toBeTruthy();

  // Raw mode suppresses copy chrome on fenced code blocks.
  cleanup();
  render(<MarkdownView markdown={edgeDoc} raw />);
  expect(screen.queryByRole('button', { name: /Copy/ })).toBeNull();
});
