// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Textarea } from '../src/index.js';

it('renders labeled native form controls with normalized initial values without a DOM', () => {
  const html = renderToString(
    <form>
      <label htmlFor="note">Notes</label>
      <Textarea
        id="note"
        name="note"
        defaultValue={'One\r\nTwo'}
        aria-describedby="help"
        required
      />
      <Textarea name="managed" value="Three" readOnly status="danger" />
    </form>,
  );
  expect(html).toContain('<label for="note">Notes</label>');
  expect(html).toMatch(/<textarea[^>]*aria-describedby="help"[^>]*>One\nTwo<\/textarea>/u);
  expect(html).toMatch(/<textarea[^>]*aria-invalid="true"[^>]*>Three<\/textarea>/u);
  expect(html.match(/<textarea\b/gu)).toHaveLength(2);
  expect(html).not.toContain('<input');
});
