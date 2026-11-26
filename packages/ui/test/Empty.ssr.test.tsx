// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Empty, EmptyActions, EmptyDescription, EmptyTitle } from '../src/index.js';

it('renders native headings, copy and commands without a client DOM', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(
    <Empty size="s" align="start">
      <EmptyTitle as="h1">Reports</EmptyTitle>
      <EmptyDescription>No reports.</EmptyDescription>
      <EmptyActions>
        <a href="/reports">All reports</a>
      </EmptyActions>
    </Empty>,
  );
  expect(html).toMatch(/<h1 [^>]*data-unica-title-size="heading-s"[^>]*>Reports<\/h1>/);
  expect(html).toMatch(/<p [^>]*>No reports\.<\/p>/);
  expect(html).toContain('<a href="/reports">All reports</a>');
  expect(html).not.toMatch(/\b(role|tabindex|aria-live)=/i);
});
