import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, expect, it, vi } from 'vitest';
import {
  Avatar,
  AvatarGroup,
  UnicaProvider,
  type AvatarGroupProps,
  type AvatarProps,
} from '../src/index.js';

afterEach(cleanup);

it.each([
  ['Alex van Rivera', 'AR'],
  ['  ß mann ', 'SM'],
  ['e\u0301quipe design', 'E\u0301D'],
  ['👩‍👩‍👧‍👦 friends', '👩‍👩‍👧‍👦F'],
  ['李 雷', '李雷'],
  ['ندى منصور', 'نم'],
  ['Writer', 'W'],
])('uses grapheme initials for %s and a separate accessible name', (name, initials) => {
  render(<Avatar alt=" Contributor " name={name} fallback="   " />);
  const identity = screen.getByRole('img', { name: 'Contributor' });
  expect(identity.textContent).toBe(initials);
  expect(identity.querySelector('[inert][aria-hidden=true]')).not.toBeNull();
  expect(screen.getAllByRole('img')).toEqual([identity]);
});

it('uses custom marks ahead of initials and pins the person glyph when the icon adapter returns null', () => {
  const { rerender } = render(<Avatar alt="" name="Alex Rivera" size="2xs" fallback="XY" />);
  expect(screen.getByText('XY').closest('[aria-hidden=true]')).not.toBeNull();
  expect(screen.queryByRole('img')).toBeNull();
  rerender(<Avatar alt="Alex" name="Alex Rivera" size="2xs" fallback={<span>◆</span>} />);
  expect(screen.getByRole('img', { name: 'Alex' }).textContent).toBe('◆');
  rerender(<Avatar alt="Alex" name="Alex Rivera" size="2xs" />);
  expect(screen.getByRole('img', { name: 'Alex' }).textContent).toBe('A');
  rerender(
    <UnicaProvider iconAdapter={() => null}>
      <Avatar alt="Unassigned" name="  " />
    </UnicaProvider>,
  );
  expect(screen.getByRole('img', { name: 'Unassigned' }).querySelector('svg path')).not.toBeNull();
});

it('isolates readiness on native image generations while keeping the frame ref stable', () => {
  const ref = createRef<HTMLSpanElement>();
  const { rerender } = render(
    <Avatar alt="Alex" name="Alex Rivera" src=" /alex.png " srcSet="/alex-2.png 2x" ref={ref} />,
  );
  const frame = screen.getByRole('img', { name: 'Alex' });
  const oldImage = frame.querySelector('img')!;
  expect(oldImage.getAttribute('src')).toBe('/alex.png');
  expect(oldImage.getAttribute('alt')).toBe('');
  expect(oldImage.hasAttribute('data-unica-avatar-image-ready')).toBe(false);
  Object.defineProperty(oldImage, 'naturalWidth', { value: 40 });
  fireEvent.load(oldImage);
  expect(oldImage.hasAttribute('data-unica-avatar-image-ready')).toBe(true);

  rerender(
    <Avatar alt="Sam" name="Sam Chen" src=" " srcSet="/sam.png 80w" sizes="40px" ref={ref} />,
  );
  const nextImage = frame.querySelector('img')!;
  expect(ref.current).toBe(frame);
  expect(frame).toBe(screen.getByRole('img', { name: 'Sam' }));
  expect(frame.textContent).toBe('SC');
  expect(nextImage).not.toBe(oldImage);
  expect(nextImage.getAttribute('src')).toBeNull();
  expect(nextImage.getAttribute('sizes')).toBe('40px');
  fireEvent.load(oldImage);
  expect(nextImage.hasAttribute('data-unica-avatar-image-ready')).toBe(false);
  Object.defineProperty(nextImage, 'naturalWidth', { value: 80 });
  fireEvent.load(nextImage);
  fireEvent.error(nextImage);
  expect(nextImage.hasAttribute('data-unica-avatar-image-ready')).toBe(false);

  rerender(<Avatar alt="Sam" name="Sam Chen" srcSet="  " ref={ref} />);
  expect(ref.current).toBe(frame);
  expect(frame.querySelector('img')).toBeNull();
});

const members: AvatarGroupProps['members'] = [
  { id: 'a', name: 'Alex Rivera' },
  { id: 'b', name: 'Sam Chen' },
  { id: 'c', name: '   ' },
  { id: 'd', name: 'Jo Martin' },
  { id: 'e', name: 'Hidden Member', src: '/e.png' },
];

it('renders only the visible prefix, preserves keyed members and exposes one localized remainder', () => {
  const ref = createRef<HTMLUListElement>();
  const overflow = vi.fn((count: number) => `${String(count)} más`);
  const { rerender } = render(
    <AvatarGroup
      label="Editors"
      members={members}
      max={3}
      showNames
      size="xs"
      getOverflowLabel={overflow}
      ref={ref}
    />,
  );
  const list = screen.getByRole('list', { name: 'Editors' });
  expect(list).toBe(ref.current);
  const [alex, sam] = within(list).getAllByRole('img');
  expect(alex?.textContent).toBe('A');
  expect(sam?.textContent).toBe('S');
  expect(list.querySelectorAll('[tabindex="0"]')).toHaveLength(2);
  expect(list.querySelector('img')).toBeNull();
  expect(overflow).toHaveBeenCalledWith(2);
  const counter = within(list).getAllByRole('listitem').at(-1);
  expect(counter?.querySelector('bdi[dir=ltr][aria-hidden=true]')?.textContent).toBe('+2');
  expect(within(list).getByText('2 más')).not.toBeNull();

  rerender(
    <AvatarGroup label="Editors" members={[members[1]!, members[0]!]} showNames ref={ref} />,
  );
  expect(ref.current).toBe(list);
  expect(within(list).getAllByRole('img')).toEqual([sam, alex]);
  expect(within(list).getAllByRole('listitem')).toHaveLength(2);
  expect(within(list).queryByText('+0')).toBeNull();
  rerender(<AvatarGroup label="Editors" members={[]} ref={ref} />);
  expect(ref.current).toBeNull();
  expect(screen.queryByRole('list')).toBeNull();
});

it.each([0, -2, 1.5, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
  'uses the default limit for %s and the singular label for a blank translation',
  (max) => {
    render(<AvatarGroup label=" " members={members} max={max} getOverflowLabel={() => ' '} />);
    const list = screen.getByRole('list', { name: 'Members' });
    expect(within(list).getAllByRole('listitem')).toHaveLength(5);
    expect(within(list).getByText('1 more member')).not.toBeNull();
    expect(list.querySelector('[tabindex]')).toBeNull();
  },
);

it('filters untyped root overrides on both components and keeps supported consumer attributes', () => {
  const onClick = vi.fn();
  const overrides = {
    role: 'button',
    'aria-label': 'Fake name',
    'aria-hidden': true,
    tabIndex: 0,
    title: 'Fake tooltip',
    contentEditable: true,
    onClick,
    children: 'Injected text',
    dangerouslySetInnerHTML: { __html: '<button>Injected action</button>' },
    'data-unica-avatar-size': 'l',
    'data-Unica-Avatar-custom': 'wrong',
    'data-owner': true,
    'data-object': { value: 1 },
    className: 'custom-root',
    style: { marginBlock: 4 },
    dir: 'rtl',
    lang: 'ar',
  };
  render(
    <>
      <Avatar {...(overrides as unknown as AvatarProps)} alt="Alex" />
      <AvatarGroup
        {...(overrides as unknown as AvatarGroupProps)}
        label="Editors"
        members={members}
      />
    </>,
  );
  const frame = screen.getByRole('img', { name: 'Alex' });
  const list = screen.getByRole('list', { name: 'Editors' });
  for (const root of [frame, list]) {
    fireEvent.click(root);
    expect(root.matches('.custom-root[data-owner=true][dir=rtl][lang=ar]')).toBe(true);
    expect(root.style.marginBlock).toBe('4px');
    expect(root.getAttribute('data-unica-avatar-size')).toBe('m');
    expect(
      root.matches('[data-unica-avatar-custom],[data-object],[tabindex],[contenteditable],[title]'),
    ).toBe(false);
  }
  expect(onClick).not.toHaveBeenCalled();
  expect(screen.queryByRole('button')).toBeNull();
  expect(screen.queryByText('Injected text')).toBeNull();
});
