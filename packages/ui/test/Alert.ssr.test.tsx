// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Alert, AlertClose, AlertDescription, AlertTitle, defineGlyph } from '../src/index.js';

it('serializes readable visible content and an empty channel for a dynamic alert', () => {
  const html = renderToString(
    <Alert
      status="danger"
      icon={defineGlyph(() => null)}
      close={<AlertClose aria-label="Dismiss validation error" onClose={() => {}} />}
    >
      <AlertTitle as="h2" id="heading">
        Check the import
      </AlertTitle>
      <AlertDescription>
        Choose a <a href="#format">supported file</a>.
      </AlertDescription>
    </Alert>,
  );
  expect(html).toContain('<h2 id="heading"');
  expect(html).toContain('>Check the import</h2>');
  expect(html).toContain('<a href="#format">supported file</a>');
  expect(html).toContain('unica-alert-glyph-fallback');
  expect(html).toContain('type="button" aria-label="Dismiss validation error"');
  expect(html).toMatch(/<span [^>]*role="alert" aria-atomic="true"><\/span>/u);
  expect(html.match(/role="alert"/gu)).toHaveLength(1);
});

it('uses only the supplied naming props during SSR and keeps static content quiet', () => {
  const html = renderToString(
    <>
      <h2 id="elsewhere">Outside the region</h2>
      <Alert role="region" aria-labelledby="elsewhere">
        Named
      </Alert>
      <Alert role="region" aria-labelledby="late">
        Waiting for a name
      </Alert>
      <Alert role="region" aria-label=" ">
        Unnamed
      </Alert>
      <Alert role="none" status="warning">
        Read before continuing
      </Alert>
    </>,
  );
  expect(html).toContain('role="region" aria-labelledby="elsewhere"');
  expect(html).toContain('role="region" aria-labelledby="late"');
  expect(html.match(/role="region"/gu)).toHaveLength(2);
  expect(html).not.toContain('aria-atomic');
});

it('renders nothing for a provably empty message', () => {
  expect(
    renderToString(
      <Alert status="danger" close={<AlertClose aria-label="Dismiss" onClose={() => {}} />}>
        <AlertTitle>{[null, false, '  ']}</AlertTitle>
        <AlertDescription>
          <>
            {undefined}
            {true}
          </>
        </AlertDescription>
      </Alert>,
    ),
  ).toBe('');
  expect(renderToString(<Alert role="none">{0}</Alert>)).toContain('>0</div>');
});
