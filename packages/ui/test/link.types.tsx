import { createRef } from 'react';
import type { JSX } from 'react';
import { Link } from '../src/index.js';
import type { LinkProps, UnicaComponentDefaults } from '../src/index.js';
import type { LinkProps as ServerLinkProps } from '../src/server.js';

export function linkTypeCases(disabled: boolean): JSX.Element {
  const shared = { href: '', disabled, size: undefined } satisfies LinkProps;
  const serverProps: ServerLinkProps = shared;
  const validDefaults = { Link: { size: 'body-m' } } satisfies UnicaComponentDefaults;

  // @ts-expect-error Link has no color defaults; tone belongs to the usage.
  const invalidDefaults = { Link: { tone: 'neutral' } } satisfies UnicaComponentDefaults;
  // @ts-expect-error An enabled native Link needs an href.
  const absent = <Link>Guide</Link>;
  // @ts-expect-error A dynamic disabled value cannot guarantee the link has no destination.
  const conditional = <Link disabled={disabled}>Guide</Link>;
  // @ts-expect-error The child owns the destination.
  const duplicate = { asChild: true, href: '/a', children: <a /> } satisfies LinkProps;
  // @ts-expect-error asChild requires one element.
  const rawChild = <Link asChild>Guide</Link>;
  // @ts-expect-error disabled owns aria-disabled.
  const conflicting = { href: '#guide', 'aria-disabled': 'true' } satisfies LinkProps;
  // @ts-expect-error A design pin is outside the public API.
  const pinned = { href: '#guide', previewFocus: true } satisfies LinkProps;
  // @ts-expect-error The native ref points to an anchor.
  const wrongRef = { href: '#guide', ref: createRef<HTMLButtonElement>() } satisfies LinkProps;
  // @ts-expect-error Link does not support HTML injection alongside composed children.
  const html = <Link href="#guide" dangerouslySetInnerHTML={{ __html: 'Guide' }} />;
  void [
    validDefaults,
    invalidDefaults,
    absent,
    conditional,
    duplicate,
    rawChild,
    conflicting,
    pinned,
    wrongRef,
    html,
  ];

  return (
    <>
      <Link {...serverProps} ref={createRef<HTMLAnchorElement>()} />
      <Link href="#guide" disabled={disabled} aria-current="location">
        Guide
      </Link>
      <Link disabled>Unavailable</Link>
      <Link asChild disabled={disabled}>
        <a href="#guide">Guide</a>
      </Link>
    </>
  );
}
