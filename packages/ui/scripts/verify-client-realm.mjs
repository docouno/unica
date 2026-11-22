// Exercise the built client entry in a host that supplies only window and document.
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createElement } from 'react';

const { window } = new JSDOM('<main></main>', { pretendToBeVisual: true });
globalThis.window = window;
globalThis.document = window.document;
const { createRoot } = await import('react-dom/client');
const { flushSync } = await import('react-dom');
const { Link } = await import('@docouno/unica');
const errors = [];
const root = createRoot(window.document.querySelector('main'), {
  onUncaughtError: (error) => errors.push(error),
});
try {
  flushSync(() => {
    root.render(
      createElement(Link, { href: '/report', target: '_blank', title: 'Details' }, 'Report'),
    );
  });
  assert.deepEqual(errors, []);
  assert.equal(window.document.querySelector('a')?.getAttribute('href'), '/report');
} finally {
  root.unmount();
  window.close();
}
