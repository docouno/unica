// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Divider } from '../src/index.js';

it('renders native and labeled markup on the server without a DOM', () => {
  expect(typeof document).toBe('undefined');
  const native = renderToString(<Divider decorative={false} aria-label="Sections" />);
  expect(native).toContain('<hr class="unica-divider-line" aria-label="Sections"/>');
  expect(native).not.toContain('role=');
  const labeled = renderToString(<Divider label="or continue" labelPosition="end" />);
  expect(labeled).toContain('<span class="unica-divider-label">or continue</span>');
  expect(labeled.match(/aria-hidden="true"/g)).toHaveLength(1);
  expect(labeled).not.toContain('<hr');
});
