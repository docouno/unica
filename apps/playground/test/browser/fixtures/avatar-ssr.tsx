import type { ReactElement } from 'react';
import { Avatar, AvatarGroup } from '@docouno/unica';

const members = [
  { id: 'a', name: 'Alex Rivera' },
  { id: 'b', name: 'Sam Chen' },
] as const;

export default function ServerAvatars(): ReactElement {
  return (
    <>
      <Avatar
        alt="Alex Rivera"
        name="Alex Rivera"
        srcSet="/avatar-test/hydrate.svg 40w"
        sizes="40px"
        data-testid="server-portrait"
      />
      <AvatarGroup label="Reviewers" members={members} />
      <AvatarGroup label="Contributors" size="s" dir="rtl" members={members} showNames />
    </>
  );
}
