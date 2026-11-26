// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Toast, ToastProvider, ToastViewport } from '../src/index.js';

it('server-renders passive feedback and defers the queue carrier until hydration', () => {
  const html = renderToString(
    <ToastProvider>
      <Toast title="Ready" status="success">
        Download the <bdi>report.csv</bdi>.
      </Toast>
      <ToastViewport />
    </ToastProvider>,
  );
  expect(html).toContain('role="group"');
  expect(html).toContain('>Ready</bdi>');
  expect(html).toContain('<bdi>report.csv</bdi>');
  expect(html).not.toContain('popover=');
  expect(html).not.toContain('role="status"');
});
