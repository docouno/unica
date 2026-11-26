import { createRef } from 'react';
import { Avatar, AvatarGroup, type AvatarGroupProps, type AvatarSize } from '../src/index.js';
import type {
  AvatarGroupProps as ServerGroupProps,
  AvatarProps as ServerAvatarProps,
  AvatarSize as ServerSize,
} from '../src/server.js';

const avatarRef = createRef<HTMLSpanElement>();
const listRef = createRef<HTMLUListElement>();
const size: AvatarSize = '2xs' satisfies ServerSize;
const members: AvatarGroupProps['members'] = [
  { id: 'a', name: 'Alex', srcSet: '/alex.jpg 1x', src: undefined, fallback: <svg /> },
];
const avatar = { alt: '', size, src: undefined, ref: avatarRef } satisfies ServerAvatarProps;
const group = { label: 'Members', members, ref: listRef } satisfies ServerGroupProps;

export const portrait = <Avatar {...avatar} sizes={undefined} data-owner="editor" inert />;
export const team = <AvatarGroup {...group} showNames={undefined} getOverflowLabel={undefined} />;

// @ts-expect-error Alt is required even when decorative.
export const missingAlt = <Avatar name="Alex" />;
// @ts-expect-error The family has five frame sizes.
export const extraSize = <Avatar alt="" size="xl" />;
// @ts-expect-error A non-string fallback must be an element.
export const numericFallback = <Avatar alt="" fallback={42} />;
// @ts-expect-error Identity content comes from the supplied portrait or fallback.
export const children = <Avatar alt="">Other content</Avatar>;
// @ts-expect-error The frame owns its accessible name.
export const aria = <Avatar alt="Alex" aria-label="Other name" />;
// @ts-expect-error Raw markup cannot replace the frame.
export const html = <Avatar alt="" dangerouslySetInnerHTML={{ __html: '<a href="/">Open</a>' }} />;
// @ts-expect-error Standalone frames are passive.
export const click = <Avatar alt="" onClick={() => undefined} />;
// @ts-expect-error The root does not accept a tab stop.
export const tab = <Avatar alt="" tabIndex={0} />;
// @ts-expect-error The group root is a list.
export const wrongRef = <AvatarGroup label="Members" members={[]} ref={avatarRef} />;
// @ts-expect-error Groups start at xs.
export const tooSmall = <AvatarGroup label="Members" members={[]} size="2xs" />;
// @ts-expect-error Every member has an explicit identity.
export const missingId = <AvatarGroup label="Members" members={[{ name: 'Alex' }]} />;
// @ts-expect-error The list must be named.
export const missingLabel = <AvatarGroup members={[]} />;
