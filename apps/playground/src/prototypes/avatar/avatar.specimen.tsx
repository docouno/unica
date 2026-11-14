import { defineSpecimen } from '../../workbench/types.js';
import { UserIcon } from '@phosphor-icons/react';
import { Avatar, AvatarGroup } from './avatar.proto.js';
import { Card, CardHeader } from '../card/card.proto.js';
import { Text } from '../text/text.proto.js';
import { Title } from '../title/title.proto.js';
import '../card/display.examples.css';

export default defineSpecimen({
  id: 'avatar',
  title: 'Avatar & AvatarGroup',
  group: 'Identity',
  summary: 'Stable identity frames and compact collaborator groups.',
  sections: [
    {
      id: 'sizes',
      title: 'Identity scale',
      kind: 'matrix',
      render: () => (
        <div className="display-example-row">
          {(['2xs', 'xs', 's', 'm', 'l'] as const).map((size) => (
            <Avatar key={size} size={size} initials="PE" aria-label="Platform Engineering" />
          ))}
          <Avatar tone="accent" initials="NW" aria-label="Networking team" />
          <Avatar tone="success" initials="RE" aria-label="Reliability team" />
        </div>
      ),
    },
    {
      id: 'content',
      title: 'Image, glyph & group overflow',
      kind: 'states',
      render: () => (
        <div className="display-example-row">
          <Avatar src="/assets/avatar-portrait-wide.png" alt="Sample avatar" />
          <Avatar src="/assets/avatar-portrait-tall.png" alt="Sample avatar portrait" />
          <Avatar aria-label="Unassigned reviewer">
            <UserIcon size="1.25em" aria-hidden="true" />
          </Avatar>
          <AvatarGroup aria-label="Document reviewers">
            <Avatar size="xs" initials="PE" />
            <Avatar size="xs" tone="accent" initials="NW" />
            <Avatar size="xs" tone="success" initials="RE" />
            <Avatar size="xs" initials="+3" />
          </AvatarGroup>
        </div>
      ),
    },
    {
      id: 'context',
      title: 'Folio · Shared editing',
      kind: 'context',
      render: () => (
        <Card>
          <CardHeader>
            <div>
              <Title as="h3" size="heading-s">
                ADR-014 Traffic Draining
              </Title>
              <Text size="caption-l" color="muted">
                Platform Engineering · Editing together
              </Text>
            </div>
            <AvatarGroup aria-label="Active collaborators">
              <Avatar size="xs" tone="accent" initials="PE" />
              <Avatar size="xs" tone="info" initials="NW" />
              <Avatar size="xs" tone="success" initials="RE" />
              <Avatar size="xs" initials="+3" />
            </AvatarGroup>
          </CardHeader>
        </Card>
      ),
    },
  ],
});
