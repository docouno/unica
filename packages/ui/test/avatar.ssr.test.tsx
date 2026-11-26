// @vitest-environment node
import { renderToString } from 'react-dom/server';
import { expect, it } from 'vitest';
import { Avatar, AvatarGroup } from '../src/index.js';

it('renders the fallback and real responsive image attributes without a client DOM', () => {
  expect(typeof document).toBe('undefined');
  const html = renderToString(
    <Avatar
      alt="Alex Rivera"
      name="Alex Rivera"
      srcSet="/alex-sm.png 40w, /alex-lg.png 80w"
      sizes="40px"
    />,
  );
  expect(html).toContain('role="img" aria-label="Alex Rivera"');
  expect(html).toContain('>AR</bdi>');
  expect(html).toMatch(/<img [^>]*srcSet="\/alex-sm\.png 40w, \/alex-lg\.png 80w"/i);
  expect(html).not.toContain('data-unica-avatar-image-ready');
});

it('renders only visible members of each named list on the server', () => {
  const members = [
    { id: 'a', name: 'Alex' },
    { id: 'b', name: 'Sam' },
    { id: 'c', name: 'Hidden Member', src: '/hidden.png' },
  ];
  const html = renderToString(
    <>
      <AvatarGroup label="First" members={members} max={2} />
      <AvatarGroup label="Second" members={members} max={1} showNames />
      <AvatarGroup label="Empty" members={[]} />
    </>,
  );
  expect(html.match(/role="list"/g)).toHaveLength(2);
  expect(html).toContain('role="list" aria-label="First"');
  expect(html).toContain('role="list" aria-label="Second"');
  expect(html.match(/aria-label="Alex"/g)).toHaveLength(2);
  expect(html).not.toContain('Hidden Member');
  expect(html).not.toContain('/hidden.png');
});
