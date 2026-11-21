// @vitest-environment node

import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Skeleton, SkeletonText } from '../src/index.js';

it('renders deterministic decorative roots in Node without a DOM', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(
    <>
      <Skeleton shape="circle" width={32} />
      <SkeletonText size="body-l" lines={2} hidden />
    </>,
  );
  expect(html).toMatch(/<span [^>]*aria-hidden="true" contentEditable="false"[^>]*><\/span>/u);
  expect(html).toMatch(/<div hidden="" [^>]*aria-hidden="true" contentEditable="false"/u);
  expect(html).toContain('inline-size:32px');
  expect(html).toContain('var(--text-size-body-l-lh)');
  expect(html.match(/unica-skeleton-text__line/gu)).toHaveLength(2);
});
